// ============================================================
//  CAP Service Implementation – Partner Relationship Management POC
//  Namespace : ybp
//  File      : srv/handlers/partner-handler.js
//
//  Wired explicitly via @impl in srv/service.cds:
//    @impl: 'srv/handlers/partner-handler.js'
//    service PartnerService @(path: '/partner') { ... }
// ============================================================
//
//  HOW CAP CONNECTS THIS FILE TO service.cds
//  ──────────────────────────────────────────────────────────
//  1. service.cds annotates the service with @impl pointing
//     to this file path.  CAP reads that annotation at boot
//     time and loads this file directly — no name-based
//     auto-discovery needed.
//
//  2. The class extends cds.ApplicationService.  All event
//     registrations happen inside init().  super.init() must
//     be called LAST so base-class handlers register after ours.
//
//  EVENT HANDLER EXECUTION ORDER (for a POST /Partner call)
//  ──────────────────────────────────────────────────────────
//  before('CREATE') → [OData adapter inserts the row] → after('CREATE')
//
//  before handlers can modify req.data BEFORE the INSERT.
//  after handlers receive the inserted row as `data`.
// ============================================================

const cds = require('@sap/cds'); //Imports the CAP framework.
const { SELECT } = require('@sap/cds/lib/ql/cds-ql');

//Extends cds.ApplicationService so you can intercept CRUD operations.
module.exports = class PartnerService extends cds.ApplicationService {

    async init() {

        // ── 1. BEFORE CREATE Partner ─────────────────────────────────────
        //
        //  Fires BEFORE the INSERT into ybp.Partner.
        //  Sets req.data.Partner_Id from the NumberRanges table so the
        //  client never needs to send it.
        //
        //  Also defaults Partner_status to E0001 (Prospective) if not sent.
        //  The status will be recalculated automatically when a PartnerType
        //  reaches PT_Status = E0005 (Operational).

        this.before('CREATE', 'Partner', async (req) => {


            // ── Country validation ────────────────────────────────────
            if (req.data.Country) {
                const country = await SELECT.one.from('ybp.VH_Country')
                    .where({ Country_Id: req.data.Country });

                if (!country)
                    return req.error(400, `Country '${req.data.Country}' does not exist. Check VH_Country for valid values.`);
            }

            //---Partner Level validation--------------------
            if (req.data.Partner_level) {
                const partner_level = await SELECT.one.from('ybp.VH_PartnerLevel').where({ Level_Id: req.data.Partner_level });

                if (!partner_level)
                    return req.error(400, `Partner level given '${req.data.Partner_level}' is not valid`);

            }

            //----Number Range
            const nr = await SELECT.one.from('ybp.NumberRanges')
                .where({ NR_Object: 'PARTNER' });

            if (!nr)
                return req.error(500, 'Number range PARTNER not configured in NumberRanges table');

            const next = parseInt(nr.Current_No, 10) + 1;
            console.log(next);

            if (next > parseInt(nr.To_No, 10))
                return req.error(500, `Number range PARTNER exhausted (max: ${nr.To_No})`);

            await UPDATE('ybp.NumberRanges')
                .set({ Current_No: next })
                .where({ NR_Object: 'PARTNER' });

            req.data.Partner_Id = nr.Prefix + String(next).padStart(nr.Digits, '0');

            if (!req.data.Partner_status)
                req.data.Partner_status = 'E0001';


        });

        // // ── 2. BEFORE CREATE PartnerTypes ────────────────────────────────
        // //
        // //  Sets req.data.Membership_id from the MEMBERSHIP number range row.

        this.before('CREATE', 'PartnerTypes', async (req) => {

            //------Partner type validation-------------------
            if (req.data.Partner_Type) {
                const partner_type = await SELECT.one.from('ybp.VH_PartnerType').where({ Type_Id: req.data.Partner_Type });

                if (!partner_type) return req.error(400, `Given Partner Type '${req.data.Partner_Type}' is not valid`);
            }

            //-----Duplicate active partner type validation-------
            if (req.data.Partner_ID && req.data.Partner_Type) {
                const existing = await SELECT.one.from('ybp.PartnerTypes')
                    .where`Partner_ID = ${req.data.Partner_ID} 
                                AND Partner_Type = ${req.data.Partner_Type} 
                                AND PT_Status NOT IN ${['E0003', 'E0009']}`;;

                if (existing)
                    return req.error(400,
                        `Partner Type '${req.data.Partner_Type}' already has an active membership for this partner. Terminate the existing membership before creating a new one.`);
            }

            const nr = await SELECT.one.from('ybp.NumberRanges')
                .where({ NR_Object: 'MEMBERSHIP' });

            if (!nr)
                return req.error(500, 'Number range MEMBERSHIP not configured in NumberRanges table');

            const next = parseInt(nr.Current_No, 10) + 1;

            if (next > parseInt(nr.To_No, 10))
                return req.error(500, `Number range MEMBERSHIP exhausted (max: ${nr.To_No})`);

            await UPDATE('ybp.NumberRanges')
                .set({ Current_No: next })
                .where({ NR_Object: 'MEMBERSHIP' });

            req.data.Membership_id = nr.Prefix + String(next).padStart(nr.Digits, '0');

            if (!req.data.PT_Status)
                req.data.PT_Status = 'E0001';

        });

        this.after(['CREATE', 'UPDATE'], 'PartnerTypes', async (data, req) => {

            console.log('>>> after PartnerTypes fired, data:', JSON.stringify(data));
            console.log('>>> Partner_ID:', data.Partner_ID);
            let partnerId = data.Partner_ID;
            //For POST call for partner type
            if (data.Partner_ID)
                await this._recalculatePartnerStatus(data.Partner_ID);

            if (!data.Partner_ID) {
                // For PATCH: data only has changed fields; get key from URL params
                const ptId = data.ID || req.params?.[0]?.ID;
                if (ptId) {
                    const pt = await SELECT.one('Partner_ID')
                        .from('ybp.PartnerTypes')
                        .where({ ID: ptId });
                    partnerId = pt?.Partner_ID;
                }
            }

            if (partnerId) await this._recalculatePartnerStatus(partnerId);
        });


        // ── 3. BEFORE CREATE Dimensions – customizing validation ─────────
        //
        //  Validates that (Partner_Type, Dim_id) exists in C_PartnerTypeDimMap.
        //  Rejects with 400 if the combination is not allowed.

        this.before('CREATE', 'Dimensions', async (req) => {
            const { PartnerType_ID, Dim_id } = req.data;

            const pt = await SELECT.one('Partner_Type')
                .from('ybp.PartnerTypes')
                .where({ ID: PartnerType_ID });

            if (!pt)
                return req.error(404, `Parent membership ${PartnerType_ID} not found`);

            const allowed = await SELECT.one
                .from('ybp.C_PartnerTypeDimMap')
                .where({ Partner_Type: pt.Partner_Type, Dim_id: Dim_id });

            if (!allowed)
                return req.error(400,
                    `Dimension '${Dim_id}' is not allowed for partner type '${pt.Partner_Type}'`);

            // Duplicaet dimension creation not allowed
            if (req.data.PartnerType_ID && req.data.Dim_id) {
                const existing = await SELECT.one.from('ybp.Dimensions')
                    .where`PartnerType_ID = ${req.data.PartnerType_ID} 
                                AND Dim_id = ${req.data.Dim_id} 
                                AND Dim_Status NOT IN ${['E0002', 'E0003', 'E0007', 'E0010']}`;;

                if (existing)
                    return req.error(400,
                        `Dimension ID '${req.data.Dim_id}' already exists in membership`);
            }

            if (!req.data.Dim_Status)
                req.data.Dim_Status = 'E0001';
        });


        this.after(['CREATE', 'UPDATE'], 'Dimensions', async (data, req) => {

            let partnerTypeId = data.PartnerType_ID;

            if (!partnerTypeId) {
                // PATCH: PartnerType_ID not in body, fetch using dimension key from URL
                const dimId = data.ID || req.params?.[0]?.ID;
                if (dimId) {
                    const dim = await SELECT.one('PartnerType_ID')
                        .from('ybp.Dimensions')
                        .where({ ID: dimId });
                    partnerTypeId = dim?.PartnerType_ID;
                }
            }

            if (!partnerTypeId) return;

            // Check if any dimension under this membership is Authorized (E0005)
            const authorized = await SELECT.one
                .from('ybp.Dimensions')
                .where({ PartnerType_ID: partnerTypeId, Dim_Status: 'E0005' });

            // E0005 = Operational | E0006 = Under Review
            const newPTStatus = authorized ? 'E0005' : data.Dim_Status;

            await UPDATE('ybp.PartnerTypes')
                .set({ PT_Status: newPTStatus })
                .where({ ID: partnerTypeId });

            // Cascade up to Partner
            const pt = await SELECT.one('Partner_ID')
                .from('ybp.PartnerTypes')
                .where({ ID: partnerTypeId });

            if (pt) await this._recalculatePartnerStatus(pt.Partner_ID);
        });


        await super.init(); //must be called so CAP can finish initialization.
    }

    // Lives outside init() but inside the class
    async _recalculatePartnerStatus(Partner_ID) {
        const lv_operational = await SELECT.one.from('ybp.PartnerTypes')
            .where({ Partner_ID: Partner_ID, PT_Status: 'E0005' });

        console.log('>>> operational found:', lv_operational);

        // E0002 = Active  |  E0001 = Prospective Partner
        const newStatus = lv_operational ? 'E0002' : 'E0001';

        await UPDATE('ybp.Partner')
            .set({ Partner_status: newStatus })
            .where({ ID: Partner_ID });
    }

};
