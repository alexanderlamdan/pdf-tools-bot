const MB = 1024 * 1024;
const GB = 1024 * 1024 * 1024;
export const TRAFFIC_BUCKETS_MB: number[] = [
    50, 100, 150, 200, 250, 300,
    400, 500, 600, 700, 800, 900, 1000,
    1200, 1400, 1600, 1800,
];

export interface BucketRow{
    sizeMB: number;
    count: number;
}

export function computeBucketTable(remainingBytes: number): BucketRow[] {

    return TRAFFIC_BUCKETS_MB.map(sizeMB => ({
        sizeMB,
        count: Math.floor(remainingBytes / (sizeMB * MB)),
    }));

}

export interface PersonalEstimate{
    avgSizeMB: number;
    remainingCount: number;
}

export function computePersonalEstimate(remainingBytes: number, fileSizesBytes: number[]): PersonalEstimate | null {

    if(fileSizesBytes.length === 0) return null;

    const avgBytes = fileSizesBytes.reduce((sum, b) => sum + b, 0) / fileSizesBytes.length;
    if(avgBytes <= 0) return null;

    return {
        avgSizeMB: Math.round(avgBytes / MB),
        remainingCount: Math.floor(remainingBytes / avgBytes),
    };

}
