// using PartnerService from './srv/service';


// // ============================================================
// //  ANNOTATIONS – PARTNER
// //  Field labels, value helps, and UI annotations in one block.
// // ============================================================
// annotate PartnerService.Partner with @(

//     // ── List Report ────────────────────────────────────────────
//     UI.SelectionFields: [ Partner_status, Country, Partner_level ],

//     UI.LineItem: [
//         { Value: Partner_Id,     Label: 'Partner ID'   },
//         { Value: Name_org,       Label: 'Organization' },
//         { Value: Country,        Label: 'Country'      },
//         { Value: Partner_status, Label: 'Status'       },
//         { Value: Partner_level,  Label: 'Level'        }
//     ],

//     // ── Object Page ────────────────────────────────────────────
//     UI.HeaderInfo: {
//         TypeName      : 'Partner',
//         TypeNamePlural: 'Partners',
//         Title         : { Value: Partner_Id },
//         Description   : { Value: Name_org   }
//     },

//     UI.FieldGroup#General: {
//         Label: 'General Information',
//         Data : [
//             { Value: Partner_Id    },
//             { Value: Name_org      },
//             { Value: Country       },
//             { Value: Partner_level }
//         ]
//     },

//     UI.FieldGroup#Status: {
//         Label: 'Status',
//         Data : [
//             { Value: Partner_status }
//         ]
//     },

//     UI.Facets: [
//         { $Type: 'UI.ReferenceFacet', Target: '@UI.FieldGroup#General',
//           Label: 'General' },
//         { $Type: 'UI.ReferenceFacet', Target: '@UI.FieldGroup#Status',
//           Label: 'Status' },
//         // Composition target: renders PartnerTypes as an embedded table.
//         // Because PartnerTypes is a Composition, each row is clickable
//         // and navigates to the PartnerTypes Object Page.
//         { $Type: 'UI.ReferenceFacet', Target: 'PartnerTypes/@UI.LineItem',
//           Label: 'Memberships' }
//     ]

// )

// {
//     // ── Field labels ───────────────────────────────────────────
//     ID             @title: 'UUID';
//     Partner_Id     @title: 'Partner ID';
//     Name_org       @title: 'Organization Name';
//     Country        @title: 'Country';
//     Partner_status @title: 'Partner Status'  @Core.Computed: true;
//     Partner_level  @title: 'Partner Level';
//     createdAt      @title: 'Created On';
//     createdBy      @title: 'Created By';
//     modifiedAt     @title: 'Last Changed On';
//     modifiedBy     @title: 'Last Changed By';

//     // ── Value helps ────────────────────────────────────────────
//     Country @(Common.ValueList: {
//         CollectionPath: 'VH_Country',
//         Parameters: [
//             { $Type: 'Common.ValueListParameterOut',
//               LocalDataProperty: Country,
//               ValueListProperty: 'Country_Id' },
//             { $Type: 'Common.ValueListParameterDisplayOnly',
//               ValueListProperty: 'Country_Name' }
//         ]
//     });

//     // Partner_status @(Common.ValueList: {
//     //     CollectionPath: 'VH_PartnerStatus',
//     //     Parameters: [
//     //         { $Type: 'Common.ValueListParameterOut',
//     //           LocalDataProperty: Partner_status,
//     //           ValueListProperty: 'Status_Id' }
//     //     ]
//     // });

//     Partner_status @(Common.ValueList: {
//         CollectionPath: 'VH_PartnerStatus',
//         Parameters: [
//             { $Type: 'Common.ValueListParameterOut',
//               LocalDataProperty: Partner_status,
//               ValueListProperty: 'Status_Id' },
//             { $Type: 'Common.ValueListParameterDisplayOnly',
//               ValueListProperty: 'Text' }
//         ]
//     });

//     Partner_level @(Common.ValueList: {
//         CollectionPath: 'VH_PartnerLevel',
//         Parameters: [
//             { $Type: 'Common.ValueListParameterOut',
//               LocalDataProperty: Partner_level,
//               ValueListProperty: 'Level_Id' }
//         ]
//     });
// }

// // ============================================================
// //  ANNOTATIONS – PARTNER TYPES  (Memberships)
// //  Field labels, value helps, and UI annotations in one block.
// // ============================================================

// annotate PartnerService.PartnerTypes with @(

//     // ── Table columns (shown inside the Partner Memberships tab) ─
//     UI.LineItem: [
//         { Value: Membership_id,   Label: 'Membership ID' },
//         { Value: Partner_Type,    Label: 'Partner Type'  },
//         { Value: Valid_from,      Label: 'Valid From'    },
//         { Value: valid_to,        Label: 'Valid To'      },
//         { Value: PT_Status,       Label: 'Status'        }
//     ],

//     // ── Object Page ────────────────────────────────────────────
//     UI.HeaderInfo: {
//         TypeName      : 'Membership',
//         TypeNamePlural: 'Memberships',
//         Title         : { Value: Membership_id },
//         Description   : { Value: Partner_Type  }
//     },

//     UI.FieldGroup#MembershipDetails: {
//         Label: 'Membership Details',
//         Data : [
//             { Value: Membership_id    },
//             { Value: Partner_Type     },
//             { Value: Valid_from       },
//             { Value: valid_to         },
//             { Value: PT_Status        },
//             { Value: PT_Status_Reason }
//         ]
//     },

//     UI.Facets: [
//         { $Type: 'UI.ReferenceFacet', Target: '@UI.FieldGroup#MembershipDetails',
//           Label: 'Details' },
//         // Composition target: renders Dimensions as an embedded table.
//         // Each row navigates to the Dimensions Object Page.
//         { $Type: 'UI.ReferenceFacet', Target: 'Dimensions/@UI.LineItem',
//           Label: 'Dimensions' }
//     ]

// )

// {
//     // ── Field labels ───────────────────────────────────────────
//     ID               @title: 'UUID';
//     Partner_ID       @title: 'Partner UUID';
//     Membership_id    @title: 'Membership ID';
//     Valid_from       @title: 'Valid From';
//     valid_to         @title: 'Valid To';
//     Partner_Type     @title: 'Partner Type';
//     PT_Status        @title: 'Membership Status'  @Core.Computed: true;
//     PT_Status_Reason @title: 'Status Reason';
//     createdAt        @title: 'Created On';
//     createdBy        @title: 'Created By';

//     // ── Value helps ────────────────────────────────────────────
//     Partner_Type @(Common.ValueList: {
//         CollectionPath: 'VH_PartnerType',
//         Parameters: [
//             { $Type: 'Common.ValueListParameterOut',
//               LocalDataProperty: Partner_Type,
//               ValueListProperty: 'Type_Id' }
//         ]
//     });

//     PT_Status @(Common.ValueList: {
//         CollectionPath: 'VH_PTStatus',
//         Parameters: [
//             { $Type: 'Common.ValueListParameterOut',
//               LocalDataProperty: PT_Status,
//               ValueListProperty: 'Status_Id' }
//         ]
//     });
// }

// // ============================================================
// //  ANNOTATIONS – DIMENSIONS
// //  Field labels, value helps, and UI annotations in one block.
// // ============================================================

// annotate PartnerService.Dimensions with @(

//     // ── Table columns (shown inside the PartnerTypes Dimensions tab) ─
//     UI.LineItem: [
//         { Value: Dim_id,            Label: 'Dimension ID'  },
//         { Value: Valid_from,        Label: 'Valid From'    },
//         { Value: valid_to,          Label: 'Valid To'      },
//         { Value: Dim_Status,        Label: 'Status'        },
//         { Value: Dim_Status_Reason, Label: 'Status Reason' }
//     ],

//     // ── Object Page ────────────────────────────────────────────
//     UI.HeaderInfo: {
//         TypeName      : 'Dimension',
//         TypeNamePlural: 'Dimensions',
//         Title         : { Value: Dim_id }
//     },

//     UI.FieldGroup#DimensionDetails: {
//         Label: 'Dimension Details',
//         Data : [
//             { Value: Dim_id            },
//             { Value: Valid_from        },
//             { Value: valid_to          },
//             { Value: Dim_Status        },
//             { Value: Dim_Status_Reason }
//         ]
//     },

//     UI.Facets: [
//         { $Type: 'UI.ReferenceFacet', Target: '@UI.FieldGroup#DimensionDetails',
//           Label: 'Details' }
//     ]

// )

// {
//     // ── Field labels ───────────────────────────────────────────
//     ID                @title: 'UUID';
//     PartnerType_ID    @title: 'Membership UUID';
//     Dim_id            @title: 'Dimension ID';
//     Valid_from        @title: 'Valid From';
//     valid_to          @title: 'Valid To';
//     Dim_Status        @title: 'Dimension Status';
//     Dim_Status_Reason @title: 'Status Reason';

//     // ── Value helps ────────────────────────────────────────────
//     Dim_id @(Common.ValueList: {
//         CollectionPath: 'VH_Dimension',
//         Parameters: [
//             { $Type: 'Common.ValueListParameterOut',
//               LocalDataProperty: Dim_id,
//               ValueListProperty: 'Dim_Id' }
//         ]
//     });

//     Dim_Status @(Common.ValueList: {
//         CollectionPath: 'VH_DimStatus',
//         Parameters: [
//             { $Type: 'Common.ValueListParameterOut',
//               LocalDataProperty: Dim_Status,
//               ValueListProperty: 'Status_Id' }
//         ]
//     });
// }