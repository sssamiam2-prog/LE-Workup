import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ImageRun,
  BorderStyle,
  AlignmentType,
  VerticalAlign,
} from 'docx';
import { type CaseSupportWorkUp, type Photo } from '../types';

const FONT_FAMILY = "Calibri";
const BORDER_STYLE = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

/**
 * Converts a base64 encoded data URL into an ArrayBuffer.
 * This is a more reliable method for docx image embedding than using fetch().
 * @param base64 The base64 data URL (e.g., "data:image/jpeg;base64,...").
 * @returns An ArrayBuffer containing the raw image data.
 */
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const base64WithoutPrefix = base64.split(',')[1];
    if (!base64WithoutPrefix) {
        throw new Error("Invalid base64 string format: missing prefix.");
    }
    const binaryString = window.atob(base64WithoutPrefix);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};


const createSectionHeader = (text: string) => {
  return new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text, bold: true, fontFamily: FONT_FAMILY, size: 20 })],
        })],
        columnSpan: 8, // Span across a reasonable number of columns
        shading: { fill: "D9D9D9" },
      }),
    ],
  });
};

const createSimpleRow = (label: string, value: string) => {
    return new TableRow({
        children: [
            new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, fontFamily: FONT_FAMILY, size: 18 })] })],
                borders: { ...NO_BORDER }
            }),
            new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: value || '', fontFamily: FONT_FAMILY, size: 18 })] })],
                 borders: { ...NO_BORDER, bottom: BORDER_STYLE }
            }),
        ],
    });
};

const createDataTable = (headers: string[], data: string[][], columnWidths: number[]) => {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths,
        rows: [
            new TableRow({
                children: headers.map(header => new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({ text: header, bold: true, fontFamily: FONT_FAMILY, size: 18 })],
                        alignment: AlignmentType.CENTER
                    })],
                    verticalAlign: VerticalAlign.CENTER,
                })),
                tableHeader: true,
            }),
            ...data.map(rowData => new TableRow({
                children: rowData.map(cellData => new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: cellData || '', fontFamily: FONT_FAMILY, size: 18 })] })],
                })),
            })),
             ...(data.length === 0 ? [new TableRow({
                children: [new TableCell({
                    children: [new Paragraph({ text: "No information available.", alignment: AlignmentType.CENTER })],
                    columnSpan: headers.length,
                })],
             })] : []),
        ],
        borders: {
            top: BORDER_STYLE,
            bottom: BORDER_STYLE,
            left: BORDER_STYLE,
            right: BORDER_STYLE,
            insideHorizontal: BORDER_STYLE,
            insideVertical: BORDER_STYLE,
        },
    });
};

export const generateWorkUpBlob = async (report: CaseSupportWorkUp): Promise<{blob: Blob, filename: string}> => {
  const { subjectInfo, otherPhotos } = report;

  let imageBuffer: ArrayBuffer | undefined = undefined;
  if (subjectInfo.mugshot?.url) {
    try {
      imageBuffer = base64ToArrayBuffer(subjectInfo.mugshot.url);
    } catch (e) {
      console.error("Failed to process mugshot image data URL", e);
    }
  }

  // Prepare other photos with their dates
  const otherImagesData: { buffer: ArrayBuffer, date: string }[] = [];
  if (otherPhotos && otherPhotos.length > 0) {
      for (const photo of otherPhotos) {
          if (photo.url) {
              try {
                  const buffer = base64ToArrayBuffer(photo.url);
                  otherImagesData.push({ buffer, date: photo.date });
              } catch (e) {
                  console.error("Failed to process an 'other' image data URL", e);
              }
          }
      }
  }
  
  // Create a section for other photos if they exist
  const otherPhotosContent: (Paragraph | Table)[] = [];
  if (otherImagesData.length > 0) {
      otherPhotosContent.push(new Paragraph("")); // Spacing
      otherPhotosContent.push(new Paragraph({ children: [new TextRun({ text: "ADDITIONAL PHOTOS:", bold: true, fontFamily: FONT_FAMILY, size: 20 })] }));

      const photoRows: TableRow[] = [];
      // Create a 2-column layout
      for (let i = 0; i < otherImagesData.length; i += 2) {
          const image1Data = otherImagesData[i];
          const image2Data = otherImagesData[i + 1];

           const createPhotoCell = (data: { buffer: ArrayBuffer, date: string } | undefined) => {
              if (!data) return new TableCell({ children: [new Paragraph("")], borders: NO_BORDER });
              return new TableCell({
                  children: [
                      new Paragraph({
                          children: [new ImageRun({ data: data.buffer, transformation: { width: 250, height: 250 } })],
                          alignment: AlignmentType.CENTER
                      }),
                      new Paragraph({
                          children: [new TextRun({ text: data.date, size: 18 })],
                          alignment: AlignmentType.CENTER
                      })
                  ],
                  borders: NO_BORDER
              });
          };

          const cell1 = createPhotoCell(image1Data);
          const cell2 = createPhotoCell(image2Data);

          photoRows.push(new TableRow({ children: [cell1, cell2] }));
      }

      otherPhotosContent.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          columnWidths: [50, 50],
          rows: photoRows,
          borders: NO_BORDER
      }));
  }

  const subjectInfoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDER,
    columnWidths: [60, 40],
    rows: [
      createSimpleRow("Name", subjectInfo.name),
      createSimpleRow("DOB", subjectInfo.dob),
      createSimpleRow("POB", subjectInfo.pob),
      createSimpleRow("SSN", subjectInfo.ssn),
      createSimpleRow("Driver License", subjectInfo.driverLicense),
      createSimpleRow("FBI #", subjectInfo.fbiNumber),
      createSimpleRow("Height / Weight", subjectInfo.heightWeight),
      createSimpleRow("Hair / Eyes", subjectInfo.hairEyes),
      createSimpleRow("Supervision", subjectInfo.supervision),
      createSimpleRow("CFP / Restriction", subjectInfo.cfpRestriction),
      createSimpleRow("ALERTS", subjectInfo.alerts),
    ]
  });

  const doc = new Document({
    sections: [{
      children: [
        // Header
        new Table({
           width: { size: 100, type: WidthType.PERCENTAGE },
           borders: NO_BORDER,
           rows: [
               new TableRow({
                   children: [
                       new TableCell({
                           children: [
                               new Paragraph({ children: [new TextRun({ text: "SALT LAKE COUNTY SHERIFF'S OFFICE", bold: true, size: 28, fontFamily: FONT_FAMILY })], alignment: AlignmentType.CENTER }),
                               new Paragraph({ children: [new TextRun({ text: "CASE SUPPORT WORK-UP", bold: true, size: 24, fontFamily: FONT_FAMILY })], alignment: AlignmentType.CENTER }),
                               new Paragraph({ children: [new TextRun({ text: "CS# SO", size: 20, fontFamily: FONT_FAMILY })], alignment: AlignmentType.CENTER }),
                           ],
                           borders: { bottom: { style: BorderStyle.DOUBLE, size: 6, color: "000000" } }
                       })
                   ]
               })
           ]
        }),

        // Spacing
        new Paragraph(""),

        // Main Content Table
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: BORDER_STYLE, bottom: BORDER_STYLE, left: BORDER_STYLE, right: BORDER_STYLE },
            rows: [
              // --- Subject Info Section ---
              createSectionHeader("Subject Information"),
              new TableRow({
                  children: [
                      new TableCell({
                          children: [
                             new Table({
                                borders: NO_BORDER,
                                width: { size: 100, type: WidthType.PERCENTAGE },
                                rows: [
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                children: [
                                                    ...(imageBuffer ? [new Paragraph({
                                                        children: [new ImageRun({ data: imageBuffer, transformation: { width: 150, height: 180 } })],
                                                        alignment: AlignmentType.CENTER,
                                                    })] : [new Paragraph("No Photo")]),
                                                    new Paragraph({ children: [new TextRun({ text: subjectInfo.mugshot?.date || '', size: 18 })], alignment: AlignmentType.CENTER }),
                                                ],
                                                verticalAlign: VerticalAlign.TOP,
                                                width: { size: 3000, type: WidthType.DXA } // 150 points * 20 = 3000
                                            }),
                                            new TableCell({
                                                children: [subjectInfoTable],
                                                verticalAlign: VerticalAlign.TOP,
                                            }),
                                        ]
                                    })
                                ]
                             })
                          ],
                          columnSpan: 8
                      })
                  ]
              }),

              // --- Tattoos / Marks ---
              createSectionHeader("Tattoos / Marks"),
              new TableRow({ children: [new TableCell({ children: [new Paragraph(report.tattoosMarks || '')], columnSpan: 8 })] }),

              // --- Aliases ---
              createSectionHeader("Aliases"),
              new TableRow({ children: [new TableCell({ children: [new Paragraph(report.aliases?.join(', ') || '')], columnSpan: 8 })] }),

              // --- Additional Information Header ---
              createSectionHeader("Additional Information"),
            ]
        }),

        // --- Addresses Table ---
        new Paragraph({ children: [new TextRun({ text: "ADDRESSES:", bold: true, fontFamily: FONT_FAMILY, size: 20 })] }),
        createDataTable(
            ["Address", "Source", "DOI"],
            report.addresses?.map(a => [a.address, a.source, a.doi]) || [],
            [60, 20, 20]
        ),
        new Paragraph(""),

        // --- Employment Table ---
        new Paragraph({ children: [new TextRun({ text: "EMPLOYMENT:", bold: true, fontFamily: FONT_FAMILY, size: 20 })] }),
        createDataTable(
            ["Address", "Source", "Dates"],
            report.employment?.map(e => [e.address, e.source, e.dates]) || [],
            [60, 20, 20]
        ),
        new Paragraph(""),

        // --- Phone Numbers Table ---
        new Paragraph({ children: [new TextRun({ text: "PHONE NUMBERS:", bold: true, fontFamily: FONT_FAMILY, size: 20 })] }),
        createDataTable(
            ["Phone", "Source", "Company/Carrier", "DOI"],
            report.phoneNumbers?.map(p => [p.phone, p.source, p.companyCarrier, p.doi]) || [],
            [25, 25, 25, 25]
        ),
        new Paragraph(""),

         // --- Vehicles Table ---
        new Paragraph({ children: [new TextRun({ text: "VEHICLES:", bold: true, fontFamily: FONT_FAMILY, size: 20 })] }),
        createDataTable(
            ["Color", "Year", "Make", "Model", "License", "VIN", "Expiration", "R/O"],
            report.vehicles?.map(v => [v.color, v.year, v.make, v.model, v.license, v.vin, v.expiration, v.ro]) || [],
            [10, 10, 15, 15, 15, 20, 10, 5]
        ),
        new Paragraph(""),

        // --- Emails ---
        new Paragraph({ children: [new TextRun({ text: "EMAILS:", bold: true, fontFamily: FONT_FAMILY, size: 20 })] }),
        new Table({
             width: { size: 100, type: WidthType.PERCENTAGE },
             rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph(report.emails?.join(', ') || '')] })] })]
        }),
        new Paragraph(""),

        // --- Social Media Table ---
        new Paragraph({ children: [new TextRun({ text: "SOCIAL MEDIA PROFILES:", bold: true, fontFamily: FONT_FAMILY, size: 20 })] }),
        createDataTable(
            ["Social Network", "Profile Handle/Vanity Name", "Profile ID Number", "Notes"],
            report.socialMediaProfiles?.map(s => [s.socialNetwork, s.profileHandle, s.profileIdNumber, s.notes]) || [],
            [20, 30, 20, 30]
        ),
        new Paragraph(""),
        
        // --- Criminal Record ---
        new Paragraph({ children: [new TextRun({ text: "CRIMINAL RECORD:", bold: true, fontFamily: FONT_FAMILY, size: 20 })] }),
        createDataTable(
            ["Date of Arrest", "Charge(s)", "Severity", "Agency", "Case Number", "Disposition"],
            report.criminalRecord?.map(c => [c.dateOfArrest, c.charges, c.severity, c.agency, c.caseNumber, c.disposition]) || [],
            [15, 30, 10, 20, 15, 10]
        ),
        new Paragraph(""),

         // --- Relatives / Associates ---
        new Paragraph({ children: [new TextRun({ text: "RELATIVES / ASSOCIATES:", bold: true, fontFamily: FONT_FAMILY, size: 20 })] }),
        createDataTable(
            ["Name", "DOB", "Relationship", "Address", "Phone Number"],
            report.relativesAssociates?.map(r => [r.name, r.dob, r.relationship, r.address, r.phoneNumber]) || [],
            [20, 15, 15, 30, 20]
        ),
        
        ...otherPhotosContent,

      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = (subjectInfo.name || 'report').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `Case_Support_Workup_${safeName}.docx`;
  
  return { blob, filename };
};