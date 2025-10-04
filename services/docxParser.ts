import { type CaseSupportWorkUp, type SubjectInformation, type AddressEntry, type EmploymentEntry, type PhoneNumberEntry, type Vehicle, type SocialMediaProfile, type CriminalRecordEntry, type RelativeAssociate, type Photo } from '../types';

// --- HELPER FUNCTIONS ---

const normalizeText = (text: string | null | undefined): string => {
    if (!text) return '';
    // Converts to uppercase and removes all non-alphanumeric characters.
    // "Tattoos / Marks:" becomes "TATTOOSMARKS"
    return text.toUpperCase().replace(/[^A-Z0-9]/g, '');
};

const parseHtmlTable = (tableEl: HTMLTableElement, skipHeader: boolean = true): string[][] => {
    const rows = Array.from(tableEl.querySelectorAll('tr'));
    if (rows.length === 0) return [];

    const data: string[][] = [];
    const rowsToParse = skipHeader ? rows.slice(1) : rows;

    for (const row of rowsToParse) {
        const cells = Array.from(row.querySelectorAll('td, th'));
        // FIX: Cast cell to HTMLElement to access innerText property.
        data.push(cells.map(cell => (cell as HTMLElement).innerText.trim()));
    }
    return data;
};

// --- PARSING LOGIC FOR EACH SECTION ---

const parsePhotos = (doc: Document): Photo[] => {
    const photos: Photo[] = [];
    const imgElements = Array.from(doc.querySelectorAll('img'));

    for (const imgEl of imgElements) {
        let date = '';
        const container = imgEl.closest('tr, p, div');

        if (container) {
            let searchText = (container as HTMLElement).innerText;
            // Also check the next element, as date is sometimes in a separate paragraph
            if (container.nextElementSibling) {
                searchText += '\n' + (container.nextElementSibling as HTMLElement).innerText;
            }
            
            const match = searchText.match(/(?:Date Taken|OTN Date|Photo Date):\s*([\d\/]+)/i);
            if (match && match[1]) {
                date = match[1].trim();
            } else {
                const dateMatch = searchText.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
                if (dateMatch && dateMatch[0]) {
                    date = dateMatch[0];
                }
            }
        }
        
        photos.push({ url: imgEl.src, date });
    }
    return photos;
};

const parseSubjectInfo = (elements: HTMLElement[], mugshot: Photo | null): SubjectInformation => {
    const info: Partial<SubjectInformation> = { mugshot };
    // Subject info is all in one table. Find the first table.
    const table = elements.find(el => el.tagName === 'TABLE') as HTMLTableElement;
    if (!table) return info as SubjectInformation;

    const rows = Array.from(table.querySelectorAll('tr'));
    for (const row of rows) {
        // Find key-value pairs within the table structure
        const cells = row.cells;
        if (cells.length < 2) continue;

        // A common pattern is a nested table for the fields.
        const innerRows = Array.from(row.querySelectorAll('tr'));
        const rowsToParse = innerRows.length > 0 ? innerRows : [row];

        for(const subRow of rowsToParse) {
            if (subRow.cells.length < 2) continue;
            const key = subRow.cells[0]?.innerText.trim().toUpperCase().replace(':', '');
            const value = subRow.cells[1]?.innerText.trim();

             if (!key || !value) continue;

             switch (key) {
                case 'NAME': info.name = value; break;
                case 'DOB': info.dob = value; break;
                case 'POB': info.pob = value; break;
                case 'SSN': info.ssn = value; break;
                case 'DRIVER LICENSE': info.driverLicense = value; break;
                case 'FBI #': info.fbiNumber = value; break;
                case 'HEIGHT / WEIGHT': info.heightWeight = value; break;
                case 'HAIR / EYES': info.hairEyes = value; break;
                case 'SUPERVISION': info.supervision = value; break;
                case 'CFP / RESTRICTION': info.cfpRestriction = value; break;
                case 'ALERTS': info.alerts = value; break;
            }
        }
    }
    return info as SubjectInformation;
};

const parseSimpleTextSection = (elements: HTMLElement[]): string => {
    return elements.map(el => el.innerText.trim()).join('\n');
}

const parseAliases = (elements: HTMLElement[]): string[] => {
    const text = parseSimpleTextSection(elements);
    return text ? text.split(',').map(s => s.trim()).filter(Boolean) : [];
}

const parseEmails = (elements: HTMLElement[]): string[] => {
    const text = parseSimpleTextSection(elements);
    return text ? text.split(/,|\s+/).map(s => s.trim()).filter(Boolean) : [];
}

const parseTableSection = <T>(elements: HTMLElement[], rowParser: (row: string[]) => T): T[] => {
    const table = elements.find(el => el.tagName === 'TABLE') as HTMLTableElement;
    if (!table) return [];
    const data = parseHtmlTable(table);
    return data.map(rowParser);
};

// --- MAIN PARSER FUNCTION ---

const SECTION_CONFIG = {
    'SUBJECTINFORMATION': { parser: parseSubjectInfo, key: 'subjectInfo' as const },
    'TATTOOSMARKS': { parser: parseSimpleTextSection, key: 'tattoosMarks' as const },
    'ALIASES': { parser: parseAliases, key: 'aliases' as const },
    'ADDRESSES': { parser: (els: HTMLElement[]) => parseTableSection(els, row => ({ address: row[0] || '', source: row[1] || '', doi: row[2] || '' })), key: 'addresses' as const },
    'EMPLOYMENT': { parser: (els: HTMLElement[]) => parseTableSection(els, row => ({ address: row[0] || '', source: row[1] || '', dates: row[2] || '' })), key: 'employment' as const },
    'PHONENUMBERS': { parser: (els: HTMLElement[]) => parseTableSection(els, row => ({ phone: row[0] || '', source: row[1] || '', companyCarrier: row[2] || '', doi: row[3] || '' })), key: 'phoneNumbers' as const },
    'VEHICLES': { parser: (els: HTMLElement[]) => parseTableSection(els, row => ({ color: row[0] || '', year: row[1] || '', make: row[2] || '', model: row[3] || '', license: row[4] || '', vin: row[5] || '', expiration: row[6] || '', ro: row[7] || '' })), key: 'vehicles' as const },
    'EMAILS': { parser: parseEmails, key: 'emails' as const },
    'SOCIALMEDIAPROFILES': { parser: (els: HTMLElement[]) => parseTableSection(els, row => ({ socialNetwork: row[0] || '', profileHandle: row[1] || '', profileIdNumber: row[2] || '', notes: row[3] || '' })), key: 'socialMediaProfiles' as const },
    'CRIMINALRECORD': { parser: (els: HTMLElement[]) => parseTableSection(els, row => ({ dateOfArrest: row[0] || '', charges: row[1] || '', severity: row[2] || '', agency: row[3] || '', caseNumber: row[4] || '', disposition: row[5] || '' })), key: 'criminalRecord' as const },
    'RELATIVESASSOCIATES': { parser: (els: HTMLElement[]) => parseTableSection(els, row => ({ name: row[0] || '', dob: row[1] || '', relationship: row[2] || '', address: row[3] || '', phoneNumber: row[4] || '' })), key: 'relativesAssociates' as const },
};

export const parseDocxContent = async (htmlContent: string): Promise<CaseSupportWorkUp> => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // Step 1: Handle all photos first.
    const allPhotosRaw = parsePhotos(doc);
    // The first two images are often logos/boilerplate, so we skip them.
    const photosToConsider = allPhotosRaw.length > 2 ? allPhotosRaw.slice(2) : allPhotosRaw;
    const mugshot: Photo | null = photosToConsider.length > 0 ? photosToConsider[0] : null;
    
    const workUp: CaseSupportWorkUp = {
        subjectInfo: { name: '', dob: '', pob: '', ssn: '', driverLicense: '', fbiNumber: '', heightWeight: '', hairEyes: '', supervision: '', cfpRestriction: '', alerts: '', mugshot: mugshot },
        tattoosMarks: '', aliases: [], addresses: [], employment: [], phoneNumbers: [], vehicles: [], emails: [], socialMediaProfiles: [], recentLEInvolvements: [], protectiveOrders: [],
        warrants: [], criminalRecord: [], relativesAssociates: [], additionalInformation: '', databasesSearched: [], otherPhotos: [],
    };

    try {
        const sections: { [key: string]: HTMLElement[] } = {};
        let currentSectionKey: string | null = null;

        const allElements = Array.from(doc.body.children) as HTMLElement[];

        // Step 2: Read document top-to-bottom, grouping elements into sections.
        for (const el of allElements) {
            const text = el.innerText;
            if (!text.trim()) continue; // Skip empty elements

            const normalizedText = normalizeText(text);
            let isHeader = false;

            for (const key in SECTION_CONFIG) {
                // Check if the element's text IS a header.
                if (key === normalizedText) {
                    currentSectionKey = key;
                    sections[currentSectionKey] = [];
                    // Special case: for Subject Info, the content is the table the header is in.
                    if (key === 'SUBJECTINFORMATION') {
                        const table = el.closest('table');
                        if (table) sections[currentSectionKey].push(table);
                    }
                    isHeader = true;
                    break;
                }
            }
            
            // If it's not a header and we are "in" a section, add it to that section's content.
            if (!isHeader && currentSectionKey) {
                // Ignore adding the subject info table again if we already have it.
                if(currentSectionKey === 'SUBJECTINFORMATION' && sections[currentSectionKey].length > 0) continue;
                sections[currentSectionKey].push(el);
            }
        }

        // Step 3: Parse the content for each identified section.
        for (const key in sections) {
            const config = SECTION_CONFIG[key as keyof typeof SECTION_CONFIG];
            if (config && sections[key].length > 0) {
                if (key === 'SUBJECTINFORMATION') {
                     workUp[config.key] = (config.parser as any)(sections[key], mugshot);
                } else {
                    // FIX: Cast parser to a function accepting one argument. This is safe because 
                    // the two-argument parser case is handled above, and TypeScript cannot infer this.
                    (workUp as any)[config.key] = (config.parser as (elements: HTMLElement[]) => any)(sections[key]);
                }
            }
        }

        // Step 4: Final cleanup of photos
        if (workUp.subjectInfo.mugshot) {
            workUp.otherPhotos = photosToConsider.filter(p => p.url !== workUp.subjectInfo.mugshot?.url);
        } else {
             workUp.otherPhotos = photosToConsider;
        }

        return workUp;
    } catch (error) {
        console.error("Error parsing document content:", error);
        throw new Error("Could not parse the document. Its format may be different than expected.");
    }
};