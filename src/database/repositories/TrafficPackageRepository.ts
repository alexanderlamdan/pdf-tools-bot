import { BaseRepository } from './BaseRepository.js';
import type { ITrafficPackage } from '../../types/TrafficPackage.js';

export class TrafficPackageRepository extends BaseRepository<ITrafficPackage>{
    
    constructor(){
        
        super('traffic_packages');
        
    }
    
    public async getActivePackages(userId:number):Promise<ITrafficPackage[]>{
        
        const rows = await this.db.query('SELECT * FROM traffic_packages WHERE user_id = $1 AND used_bytes < size_bytes ORDER BY purchased_at ASC',[userId]);
        
        return this.normalize(rows);
        
    }
    
    public async addUsage(packageId:number,bytes:number):Promise<void>{
        
        await this.db.query('UPDATE traffic_packages SET used_bytes = LEAST(used_bytes + $1,size_bytes) WHERE id = $2',[bytes,packageId]);
        
    }
    
    public async getTotalRemainingBytes(userId:number):Promise<number>{
        
        const res = await this.db.query('SELECT COALESCE(SUM(size_bytes - used_bytes),0) as remaining FROM traffic_packages WHERE user_id = $1 AND used_bytes < size_bytes',[userId]);
        
        return Number(res[0]?.remaining || 0);
        
    }
    
    public async deductFifo(userId:number,bytes:number):Promise<void>{
        
        let remaining = bytes;
        const packages = await this.getActivePackages(userId);
        
        for(const pkg of packages){
            
            if(remaining <= 0) break;
            
            const available = pkg.sizeBytes - pkg.usedBytes;
            const toDeduct = Math.min(available,remaining);
            
            if(toDeduct > 0){
                
                await this.addUsage(pkg.id,toDeduct);
                remaining -= toDeduct;
                
            }
            
        }
        
    }
    
    public async create(data:Partial<ITrafficPackage>):Promise<ITrafficPackage>{
        
        return super.create(data);
        
    }
    
    public async getPurchaseHistory(userId:number):Promise<Array<{label:string;sizeBytes:number;count:number;totalCents:number}>>{
        
        const rows = await this.db.query(`SELECT label,size_bytes,COUNT(*) as count,SUM(price_cents) as total_cents FROM traffic_packages WHERE user_id = $1 GROUP BY label, size_bytes ORDER BY size_bytes ASC`,[userId]);
        
        return rows.map((r:any)=>({
            label:r.label,
            sizeBytes:Number(r.size_bytes),
            count:Number(r.count),
            totalCents:Number(r.total_cents)
        }));
        
    }
    
}
