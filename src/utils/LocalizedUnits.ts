export interface SizeUnits{
    kb: string;
    mb: string;
    gb: string;
}

const KB = 1024;
const MB = 1024 * 1024;
const GB = 1024 * 1024 * 1024;

export function formatBytes(bytes:number, units:SizeUnits):string{

    if(bytes >= GB) return `${(bytes / GB).toFixed(2)} ${units.gb}`;
    if(bytes >= MB) return `${(bytes / MB).toFixed(2)} ${units.mb}`;
    return `${(bytes / KB).toFixed(2)} ${units.kb}`;

}

export function formatBytesPair(usedBytes:number, limitBytes:number, units:SizeUnits):{used:string, limit:string}{

    let divisor = KB, unitLabel = units.kb;
    if(limitBytes >= GB){ divisor = GB; unitLabel = units.gb; }
    else if(limitBytes >= MB){ divisor = MB; unitLabel = units.mb; }

    return {
        used:  `${(usedBytes / divisor).toFixed(2)} ${unitLabel}`,
        limit: `${(limitBytes / divisor).toFixed(2)} ${unitLabel}`,
    };

}
