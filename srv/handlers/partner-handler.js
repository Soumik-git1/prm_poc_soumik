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


        // this.before('CREATE', 'Partner', async (req) => {
        //     // const { NumberRanges } = this.entities;//commenting this to check

        //     // const nr = await SELECT.one.from(NumberRanges)
        //     //     .where({ NR_Object: 'PARTNER' });

        //     const nr = await SELECT.one.from('ybp.NumberRanges')
        //         .where({ NR_Object: 'PARTNER' });

        //     if (!nr)
        //         return req.error(500, 'Number range PARTNER not configured in NumberRanges table');

        //     const next = nr.Current_No + 1;

        //     if (next > nr.To_No)
        //         return req.error(500, `Number range PARTNER exhausted (max: ${nr.To_No})`);

        //     // await UPDATE(NumberRanges)
        //     //     .set({ Current_No: next })
        //     //     .where({ NR_Object: 'PARTNER' });

        //     await UPDATE('ybp.NumberRanges')
        //         .set({ Current_No: next })
        //         .where({ NR_Object: 'PARTNER' });                

        //     // Format: Prefix + zero-padded counter → e.g. "P" + "0001006" = "P0001006"
        //     req.data.Partner_Id = nr.Prefix + String(next).padStart(nr.Digits, '0');

        //     if (!req.data.Partner_status)
        //         req.data.Partner_status = 'E0001';
        // });


        // // ── 2. BEFORE CREATE PartnerTypes ────────────────────────────────
        // //
        // //  Sets req.data.Membership_id from the MEMBERSHIP number range row.

        this.before('CREATE', 'PartnerTypes', async (req) => {

            const nr = await SELECT.one.from('ybp.NumberRanges')
                .where({ NR_Object: 'MEMBERSHIP' });

            if (!nr)
                return req.error(500, 'Number range MEMBERSHIP not configured in NumberRanges table');

            const next = parseInt(nr.Current_No, 10) + 1;

            if (next > parseInt(nr.To_No ,10))
                return req.error(500, `Number range MEMBERSHIP exhausted (max: ${nr.To_No})`);

            await UPDATE('ybp.NumberRanges')
                .set({ Current_No: next })
                .where({ NR_Object: 'MEMBERSHIP' });

            req.data.Membership_id = nr.Prefix + String(next).padStart(nr.Digits, '0');
        });

        // this.before('CREATE', 'PartnerTypes', async (req) => {
        //     const { NumberRanges } = this.entities;

        //     const nr = await SELECT.one.from(NumberRanges)
        //         .where({ NR_Object: 'MEMBERSHIP' });

        //     if (!nr)
        //         return req.error(500, 'Number range MEMBERSHIP not configured in NumberRanges table');

        //     const next = nr.Current_No + 1;

        //     if (next > nr.To_No)
        //         return req.error(500, `Number range MEMBERSHIP exhausted (max: ${nr.To_No})`);

        //     await UPDATE(NumberRanges)
        //         .set({ Current_No: next })
        //         .where({ NR_Object: 'MEMBERSHIP' });

        //     req.data.Membership_id = nr.Prefix + String(next).padStart(nr.Digits, '0');
        // });


        // // ── 3. BEFORE CREATE Dimensions – customizing validation ─────────
        // //
        // //  Validates that (Partner_Type, Dim_id) exists in C_PartnerTypeDimMap.
        // //  Rejects with 400 if the combination is not allowed.

        // this.before('CREATE', 'Dimensions', async (req) => {
        //     const { PartnerType_ID, Dim_id } = req.data;

        //     const pt = await SELECT.one('Partner_Type')
        //         .from('ybp.PartnerTypes')
        //         .where({ ID: PartnerType_ID });

        //     if (!pt)
        //         return req.error(404, `Parent membership ${PartnerType_ID} not found`);

        //     const allowed = await SELECT.one
        //         .from('ybp.C_PartnerTypeDimMap')
        //         .where({ Partner_Type: pt.Partner_Type, Dim_id: Dim_id });

        //     if (!allowed)
        //         return req.error(400,
        //             `Dimension '${Dim_id}' is not allowed for partner type '${pt.Partner_Type}'`);
        // });


        // // ── 4. AFTER CREATE/UPDATE Dimensions – PT_Status cascade ────────

        // this.after(['CREATE', 'UPDATE'], 'Dimensions', async (data, req) => {
        //     const { PartnerType_ID } = data;

        //     const authorized = await SELECT.one
        //         .from('ybp.Dimensions')
        //         .where({ PartnerType_ID, Dim_Status: 'E0005' });

        //     const newPTStatus = authorized ? 'E0005' : 'E0006';

        //     await UPDATE('ybp.PartnerTypes')
        //         .set({ PT_Status: newPTStatus })
        //         .where({ ID: PartnerType_ID });

        //     const pt = await SELECT.one('Partner_ID')
        //         .from('ybp.PartnerTypes')
        //         .where({ ID: PartnerType_ID });

        //     if (pt) await this._recalculatePartnerStatus(pt.Partner_ID);
        // });


        // // ── 5. AFTER CREATE/UPDATE PartnerTypes – Partner_status cascade ─

        // this.after(['CREATE', 'UPDATE'], 'PartnerTypes', async (data, req) => {
        //     if (data.Partner_ID)
        //         await this._recalculatePartnerStatus(data.Partner_ID);
        // });


        // // ── 6. BOUND ACTION – recalculateStatus on Partner ───────────────

        // this.on('recalculateStatus', 'Partner', async (req) => {
        //     const { ID } = req.params[0];
        //     await this._recalculatePartnerStatus(ID);
        //     return SELECT.one.from('ybp.Partner').where({ ID });
        // });


        // // ── 7. BOUND ACTION – recalculatePTStatus on PartnerTypes ────────

        // this.on('recalculatePTStatus', 'PartnerTypes', async (req) => {
        //     const { ID } = req.params[0];

        //     const authorized = await SELECT.one
        //         .from('ybp.Dimensions')
        //         .where({ PartnerType_ID: ID, Dim_Status: 'E0005' });

        //     const newPTStatus = authorized ? 'E0005' : 'E0006';

        //     await UPDATE('ybp.PartnerTypes')
        //         .set({ PT_Status: newPTStatus })
        //         .where({ ID });

        //     const pt = await SELECT.one('Partner_ID')
        //         .from('ybp.PartnerTypes')
        //         .where({ ID });

        //     if (pt) await this._recalculatePartnerStatus(pt.Partner_ID);

        //     return SELECT.one.from('ybp.PartnerTypes').where({ ID });
        // });


        await super.init(); //must be called so CAP can finish initialization.
    }


    // async _recalculatePartnerStatus(Partner_ID) {
    //     const operational = await SELECT.one
    //         .from('ybp.PartnerTypes')
    //         .where({ Partner_ID, PT_Status: 'E0005' });

    //     const newStatus = operational ? 'E0002' : 'E0001';

    //     await UPDATE('ybp.Partner')
    //         .set({ Partner_status: newStatus })
    //         .where({ ID: Partner_ID });
    // }
};
