import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const SCHEMA_PATH  = path.resolve(__dirname, '../locale-schema.json');

const LOCALES_PATH = path.resolve(__dirname, '../../src/locales/en.js');

function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {

    const keys: string[] = [];

    for(const [key, value] of Object.entries(obj)){

        const fullKey = prefix ? `${prefix}.${key}` : key;

        if(value !== null && typeof value === 'object' && !Array.isArray(value)){
            keys.push(...collectKeys(value as Record<string, unknown>, fullKey));
        }else{
            keys.push(fullKey);
        }

    }

    return keys;

}

async function main(): Promise<void>{

    console.log('📖 Reading EN locale...');
    console.log(`   From: ${LOCALES_PATH}`);

    if(!fs.existsSync(LOCALES_PATH)){
        console.error(`❌ File not found: ${LOCALES_PATH}`);
        console.error(`   Run "npm run build" first.`);
        process.exit(1);
    }

    const module_  = await import(LOCALES_PATH);
    const enLocale = module_.en ?? module_.locales?.en ?? module_.default;

    if(!enLocale){
        console.error('❌ Could not find "en" export.');
        process.exit(1);
    }

    const keys: string[] = [];

    if(enLocale.buttons)  keys.push(...collectKeys(enLocale.buttons  as Record<string, unknown>, 'buttons'));
    if(enLocale.messages) keys.push(...collectKeys(enLocale.messages as Record<string, unknown>, 'messages'));
    if(enLocale.errors)   keys.push(...collectKeys(enLocale.errors   as Record<string, unknown>, 'errors'));

    keys.sort();

    const schema = {
        generated_at: new Date().toISOString(),
        source:       'en bot',
        key_count:    keys.length,
        keys,
    };
    
    const schemaDistPath = SCHEMA_PATH;
    const schemaSrcPath  = path.resolve(__dirname, '../../../shared/locale-schema.json');

    fs.writeFileSync(schemaDistPath, JSON.stringify(schema, null, 2), 'utf-8');
    console.log(`✅ Written to dist: ${schemaDistPath}`);

    if(fs.existsSync(path.dirname(schemaSrcPath))){
        fs.writeFileSync(schemaSrcPath, JSON.stringify(schema, null, 2), 'utf-8');
        console.log(`✅ Written to src:  ${schemaSrcPath}`);
    }

    console.log(`\n📊 Total keys: ${keys.length}`);
    console.log(`\nNext steps:`);
    console.log(`  1. cd shared && git add locale-schema.json && git commit -m "chore: update locale schema"`);
    console.log(`  2. In RU/HE bots: git submodule update --remote shared`);
    console.log(`  3. In RU/HE bots: npm run build && npm run locale:check`);

}

main().catch(e => { console.error('❌ Fatal:', e); process.exit(1); });
