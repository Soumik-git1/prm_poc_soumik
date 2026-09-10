// ============================================================
//  CAP CDS Schema – Partner Relationship Management POC
//  Namespace : ybp
//  File      : schema.cds
// ============================================================

namespace ybp;

/** aspect in CAPM */
using { cuid, managed } from '@sap/cds/common';

// ============================================================
//  VALUE HELP ENTITIES
// ============================================================

// YBP_D_VH_COUNTRY
// Example IN India | DE Germany | US United States |
entity VH_Country {
    key Country_Id   : String(3);
        Country_Name : String(50);
}

// YBP_D_VH_PSTATUS
// E0001 Prospective Partner | E0002 Active | E0003 Discontinued
entity VH_PartnerStatus {
    key Status_Id : String(5);
        toText    : Association to many ValueTexts
                      on  toText.Domain = 'PSTATUS'
                      and toText.Code   = Status_Id;
}

// YBP_D_VH_PLEVEL
// (e.g. GOLD Gold | SILV Silver | BRNZ Bronze)
entity VH_PartnerLevel {
    key Level_Id : String(20);
        toText   : Association to many ValueTexts
                     on  toText.Domain = 'PLEVEL'
                     and toText.Code   = Level_Id;
}

// YBP_D_VH_PTYPE
// YVAR PE Sell | YRUN PE RUN | YBLD PE Build | YSRVP PE Service
entity VH_PartnerType {
    key Type_Id : String(10);
        toText  : Association to many ValueTexts
                    on  toText.Domain = 'PTYPE'
                    and toText.Code   = Type_Id;
}

// YBP_D_VH_PTSTATUS
// E0001–E0009  (see ValueTexts for text)
entity VH_PTStatus {
    key Status_Id : String(10);
        toText    : Association to many ValueTexts
                      on  toText.Domain = 'PTSTATUS'
                      and toText.Code   = Status_Id;
}

// YBP_D_VH_DIM
// Example: YABC (text in ValueTexts Domain=DIM)
entity VH_Dimension {
    key Dim_Id : String(10);
        toText : Association to many ValueTexts
                   on  toText.Domain = 'DIM'
                   and toText.Code   = Dim_Id;
}

// YBP_D_VH_DIMSTATUS
// E0001–E0011  (see ValueTexts for text)
entity VH_DimStatus {
    key Status_Id : String(30);
        toText    : Association to many ValueTexts
                      on  toText.Domain = 'DIMSTATUS'
                      and toText.Code   = Status_Id;
}

// ============================================================
//  COMMON TEXT TABLE   (YBP_D_TEXTS)
//  Domain constants:
//    PSTATUS | PLEVEL | PTYPE | PTSTATUS | DIM | DIMSTATUS
//  (VH_Country has inline Country_Name; no COUNTRY domain entry)
// ============================================================

entity ValueTexts {
    key Domain      : String(20);
    key Code        : String(30);
    key Language    : String(2);
        Description : String(100);
}

// ============================================================
//  CUSTOMIZING TABLE   (YBP_C_PT_DIM_MAP)
// ============================================================

entity C_PartnerTypeDimMap {
    key Partner_Type  : String(10);   // FK → VH_PartnerType.Type_Id
    key Dim_id        : String(10);   // FK → VH_Dimension.Dim_Id
        Is_Mandatory  : Boolean default false;

        toPartnerType : Association to VH_PartnerType
                          on toPartnerType.Type_Id = Partner_Type;
        toDimension   : Association to VH_Dimension
                          on toDimension.Dim_Id    = Dim_id;
}

// ============================================================
//  NUMBER RANGE TABLE   (YBP_C_NR_OBJECT)
//
//  One row per business object that needs auto-generated IDs.
//  The before-CREATE handler increments Current_No atomically,
//  then formats:  Partner_Id = Prefix + padStart(Current_No, Digits, '0')
//
//  Example row for PARTNER:
//    NR_Object  = 'PARTNER'
//    Prefix     = 'P'
//    Digits     = 7           →  P + 0001006 = 'P0001006'
//    From_No    = 1001        (first number ever issued)
//    To_No      = 9999999     (upper limit – error if exceeded)
//    Current_No = 1005        (last number issued; seed matches CSV data)
//
//  Extend with additional rows for MEMBERSHIP, DIMENSION, etc.
// ============================================================

entity NumberRanges {
    key NR_Object  : String(20);   // e.g. 'PARTNER', 'MEMBERSHIP'
        Prefix     : String(5);    // e.g. 'P', 'M'
        Digits     : Integer;      // digit count after prefix (padding width)
        From_No    : Integer64;    // lowest number in range
        To_No      : Integer64;    // highest number in range
        Current_No : Integer64;    // last number issued (incremented on each CREATE)
}


// ============================================================
//  MAIN ENTITY: Partner   (YBP_D_PARTNER)
// ============================================================

entity Partner : cuid, managed {
    //-- NEW UUID technical PK (injected by cuid as: key ID : UUID)

    //-- Original business key (Char10) – kept alongside UUID
    Partner_Id      : String(10);     // e.g. 'P0001001'

    Name_org        : String(50);

    //-- FK to VH_Country via business key
    Country         : String(3);      // FK → VH_Country.Country_Id

    //-- FK to VH_PartnerStatus via business key  
    Partner_status  : String(5);      // FK → VH_PartnerStatus.Status_Id

    //-- FK to VH_PartnerLevel via business key
    Partner_level   : String(20);     // FK → VH_PartnerLevel.Level_Id

    //-- Navigations to VH (String business key associations)
    toCountry       : Association to VH_Country
                        on toCountry.Country_Id    = Country;
    toStatus        : Association to VH_PartnerStatus
                        on toStatus.Status_Id      = Partner_status;
    toLevel         : Association to VH_PartnerLevel
                        on toLevel.Level_Id        = Partner_level;

    //-- Composition to PartnerTypes linked via UUID
    PartnerTypes    : Composition of many PartnerTypes
                        on PartnerTypes.Partner_ID = $self.ID;
}

// ============================================================
//  MAIN ENTITY: PartnerTypes   (YBP_D_PARTNERTYPES)
// ============================================================

entity PartnerTypes : cuid, managed {
    //-- NEW UUID technical PK (injected by cuid as: key ID : UUID)

    //-- FK to parent Partner via UUID  (NEW field)
    Partner_ID          : UUID;           // FK → Partner.ID

    // //-- Denormalised copy of parent business key (for display/filter)
    // Partner_Id          : String(10);     // copy of Partner.Partner_Id

    //-- Original business keys (Char10) – kept alongside UUID
    Membership_id       : String(10);     // e.g. 'M0000001'
    valid_to            : Date;
    Valid_from          : Date;

    //-- FK to VH_PartnerType via business key
    Partner_Type        : String(10);     // FK → VH_PartnerType.Type_Id

    //-- FK to VH_PTStatus via business key  |  AUTO-COMPUTED
    PT_Status           : String(10);     // FK → VH_PTStatus.Status_Id
    PT_Status_Reason    : String(50);

    //-- Navigations to parent Partner (UUID association)
    toPartner           : Association to Partner
                            on toPartner.ID           = Partner_ID;

    //-- Navigations to VH (String business key associations)
    toPartnerType       : Association to VH_PartnerType
                            on toPartnerType.Type_Id  = Partner_Type;
    toPTStatus          : Association to VH_PTStatus
                            on toPTStatus.Status_Id   = PT_Status;

    //-- Composition to Dimensions linked via UUID
    Dimensions          : Composition of many Dimensions
                            on Dimensions.PartnerType_ID = $self.ID;
}

// ============================================================
//  MAIN ENTITY: Dimensions   (YPT_D_DIMENSIONS)
// ============================================================

entity Dimensions : cuid {
    //-- NEW UUID technical PK (injected by cuid as: key ID : UUID)

    //-- FK to parent PartnerTypes via UUID  (NEW field)
    PartnerType_ID      : UUID;           // FK → PartnerTypes.ID

    //-- Denormalised copy of parent business key (for query convenience)
    Membership_id       : String(10);     // copy of PartnerTypes.Membership_id

    //-- Original business key (Char10) – kept alongside UUID
    Dim_id              : String(10);     // FK → VH_Dimension.Dim_Id  |  VALIDATED
    valid_to            : Date;
    Valid_from          : Date;

    //-- FK to VH_DimStatus via business key  |  triggers PT_Status cascade
    Dim_Status          : String(30);     // FK → VH_DimStatus.Status_Id
    Dim_Status_Reason   : String(50);

    //-- Navigation to parent PartnerTypes (UUID association)
    toPartnerType       : Association to PartnerTypes
                            on toPartnerType.ID       = PartnerType_ID;

    //-- Navigations to VH (String business key associations)
    toDimension         : Association to VH_Dimension
                            on toDimension.Dim_Id     = Dim_id;
    toDimStatus         : Association to VH_DimStatus
                            on toDimStatus.Status_Id  = Dim_Status;
}