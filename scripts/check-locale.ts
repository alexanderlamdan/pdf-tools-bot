import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const SCHEMA_PATH  = path.resolve(__dirname, '../../../shared/locale-schema.json');
const LOCALES_PATH = path.resolve(__dirname, '../../src/locales/index.js');

// Цвета терминала
const RED    = '\x1b[31m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

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

    if(!fs.existsSync(SCHEMA_PATH)){
        console.error(`${RED}❌ locale-schema.json not found: ${SCHEMA_PATH}${RESET}`);
        console.error(`   Run in EN bot: npm run build && npm run locale:generate`);
        process.exit(1);
    }

    const schema     = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8')) as {
        generated_at: string;
        key_count:    number;
        keys:         string[];
    };
    const schemaKeys = new Set<string>(schema.keys);

    console.log(`${CYAN}📋 Schema: ${schema.key_count} keys (generated ${schema.generated_at.slice(0, 10)})${RESET}\n`);

    if(!fs.existsSync(LOCALES_PATH)){
        console.error(`${RED}❌ Locale not found: ${LOCALES_PATH}${RESET}`);
        console.error(`   Run: npm run build`);
        process.exit(1);
    }

    const localeModule = await import(LOCALES_PATH) as { locales: Record<string, unknown> };
    const langKey      = Object.keys(localeModule.locales ?? {})[0] ?? 'unknown';
    const locale       = localeModule.locales?.[langKey] as Record<string, unknown> | undefined;

    if(!locale){
        console.error(`${RED}❌ Could not find locale export in ${LOCALES_PATH}${RESET}`);
        process.exit(1);
    }

    console.log(`${BOLD}🤖 Bot locale: ${langKey.toUpperCase()}${RESET}\n`);

    const botKeys = new Set<string>();
    if(locale.buttons)  collectKeys(locale.buttons  as Record<string, unknown>, 'buttons').forEach(k  => botKeys.add(k));
    if(locale.messages) collectKeys(locale.messages as Record<string, unknown>, 'messages').forEach(k => botKeys.add(k));
    if(locale.errors)   collectKeys(locale.errors   as Record<string, unknown>, 'errors').forEach(k   => botKeys.add(k));

    const missing: string[] = [];
    const extra:   string[] = [];

    for(const key of schemaKeys){
        if(!botKeys.has(key)) missing.push(key);
    }

    for(const key of botKeys){
        if(!schemaKeys.has(key)) extra.push(key);
    }

    const ok = schema.key_count - missing.length;

    console.log(`${GREEN}✅ Present: ${ok} / ${schema.key_count} keys${RESET}`);

    if(missing.length === 0 && extra.length === 0){
        console.log(`\n${GREEN}${BOLD}🎉 All keys match!${RESET}\n`);
        process.exit(0);
    }

    if(missing.length > 0){
        console.log(`\n${RED}${BOLD}❌ Missing keys (${missing.length}):${RESET}`);
        for(const key of missing.sort()){
            console.log(`   ${RED}− ${key}${RESET}`);
        }
    }

    if(extra.length > 0){
        console.log(`\n${YELLOW}${BOLD}⚠️  Extra keys not in schema (${extra.length}):${RESET}`);
        for(const key of extra.sort()){
            console.log(`   ${YELLOW}+ ${key}${RESET}`);
        }
        console.log(`   ${YELLOW}(Present in this bot but not in EN — may be intentional)${RESET}`);
    }

    console.log('');
    process.exit(missing.length > 0 ? 1 : 0);

}

main().catch(e => { console.error('❌ Fatal:', e); process.exit(1); });
