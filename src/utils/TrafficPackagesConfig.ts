export interface ITrafficPackageDef{
    
    sizeBytes:number;
    priceCents:number;
    label:string;
    productIds:{creem:string;dodo:string};
    
}

const GB = 1024 * 1024 * 1024;

export const TRAFFIC_PACKAGES:Record<string,ITrafficPackageDef> = {
    
    pkg_6gb:{
        sizeBytes:  6 * GB,
        priceCents: 100,
        label:      '6 GB — $1',
        productIds: { creem: 'prod_*********', dodo: 'prod_*********' },
    },
    
    pkg_8gb:{
        sizeBytes:  8 * GB,
        priceCents: 200,
        label:      '8 GB — $2',
        productIds: { creem: 'prod_*********', dodo: 'prod_*********' },
    },
    
    pkg_16gb:{
        sizeBytes:  16 * GB,
        priceCents: 500,
        label:      '16 GB — $5',
        productIds: { creem: 'prod_*********', dodo: 'prod_*********' },
    },
    
    pkg_18gb:{
        sizeBytes:  18 * GB,
        priceCents: 800,
        label:      '18 GB — $8',
        productIds: { creem: 'prod_*********', dodo: 'prod_*********' },
    },
    
    pkg_20gb:{
        sizeBytes:  20 * GB,
        priceCents: 1000,
        label:      '20 GB — $10',
        productIds: { creem: 'prod_*********', dodo: 'prod_*********' },
    },
    
    pkg_25gb:{
        sizeBytes:  30 * GB,
        priceCents: 1500,
        label:      '30 GB — $15',
        productIds: { creem: 'prod_*********', dodo: 'prod_*********' },
    },
    
    pkg_50gb:{
        sizeBytes:  50 * GB,
        priceCents: 2500,
        label:      '50 GB — $25',
        productIds: { creem: 'prod_*********', dodo: 'prod_*********' },
    },
    
    pkg_80gb:{
        sizeBytes:  80 * GB,
        priceCents: 4500,
        label:      '80 GB — $45',
        productIds: { creem: 'prod_*********', dodo: 'prod_*********' },
    },
    
    pkg_100gb:{
        sizeBytes:  150 * GB,
        priceCents: 7000,
        label:      '150 GB — $70',
        productIds: { creem: 'prod_*********', dodo: 'prod_*********' },
    },
    
    pkg_200gb:{
        sizeBytes:  350 * GB,
        priceCents: 15000,
        label:      '350 GB — $150',
        productIds: { creem: 'prod_*********', dodo: 'prod_*********' },
    }
    
};

export function getPackageProductId(packageId:string,provider:'creem'|'dodo'):string | null{
    
    const pkg = TRAFFIC_PACKAGES[packageId];
    if(!pkg) return  null;
    
    const productId = pkg.productIds[provider];
    return productId ? productId : null;
    
}

export const PRODUCT_TO_PACKAGE:Record<string,{id:string} & ITrafficPackageDef> = (()=>{
    
    const map:Record<string,{id:string} & ITrafficPackageDef> = {};
    
    for(const id in TRAFFIC_PACKAGES){
        
        const pkg = TRAFFIC_PACKAGES[id];
        
        if(pkg.productIds.creem) map[`creem:${pkg.productIds.creem}`] = {id,...pkg};
        if(pkg.productIds.dodo) map[`dodo:${pkg.productIds.dodo}`] = {id,...pkg};
        
    }
    
    return map;
    
})();
