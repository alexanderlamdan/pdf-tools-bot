import fs from 'fs';
import path from 'path';
import os from 'os';
import {exec} from 'child_process';
import {Bot,InputFile} from 'grammy';
import type {IBotConfig} from '../config/interfaces/IBotConfig.js';
import type {User,Message} from 'grammy/types';
import {TelegramLogFormatter} from './telegramLogFormatter/TelegramLogFormatter.js';
import { UserInfoFormatter } from '../utils/UserInfoFormatter.js';

export class LoggerService{

	private readonly logDir:string;
	private readonly logChannelId:number;
	private readonly logBot:Bot;
	private readonly formatter:TelegramLogFormatter;
	private readonly maxFileSize = 50 * 1024 * 1024;

	constructor(private readonly config:IBotConfig){

		this.logDir = `/srv/runtime/${config.botName}/logs`;
		if(config.channelLogId === undefined){

			throw new Error('LoggerService: config.channelLogId is required');

		}
		this.logChannelId = config.channelLogId;
		this.logBot = new Bot(config.token,{
			client:{
				apiRoot:this.config.localApiFile
			}
		});
		this.formatter = new TelegramLogFormatter();

	}

	private ensureDirSync(dir:string){

		if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});

	}

	public logToFile(subpath:string,message:string){

		const fullPath = path.join(this.logDir,subpath);
		const now = new Date();
		const timeString = `[${now.toLocaleString('en-IL', {timeZone: 'Asia/Jerusalem',
    		year: 'numeric',
   			month: '2-digit',
    		day: '2-digit',
    		hour: '2-digit',
    		minute: '2-digit',
    		second: '2-digit',
    		hour12: false
		}).replace(/[/]/g, '-').replace(',', '')}]`;
		const logLine = `[${timeString}] ${message}\n`;

		this.ensureDirSync(path.dirname(fullPath));
		
		try{
			
			if(fs.existsSync(fullPath)){
				
				const stats = fs.statSync(fullPath);
				if(stats.size >= this.maxFileSize){
					
					const timestamp = Date.now();
					const rotatedPath = `${fullPath}.${timestamp}`;
					
					fs.renameSync(fullPath,rotatedPath);
					
					const archiveName = `${path.basename(rotatedPath)}.tar.gz`;
					const dirName = path.dirname(fullPath);
					
					exec(`tar -czf "${archiveName}" "${path.basename(rotatedPath)}" && rm "${path.basename(rotatedPath)}"`,{cwd:dirName},(error)=>{
						if(error){
							
							console.error(`[Logger] Failed to compress log: ${error.message}`);
							
						}else{
							
							console.log(`[Logger] Log archived: ${archiveName}`);
							
						}
					});
					
				}
				
			}
			
		}catch(e){
			
			console.error('[Logger] Error during log rotation: ',e);
			
		}
		
		try{
			
			fs.appendFileSync(fullPath,logLine,'utf-8');
			
		}catch(e){
			
			console.error('[Logger] Failed to write to file: ',e);
			
		}

	}

	public async logAction(
		source:string,
		user:User,
		action:string,
		details:string = '',
		result?:string
	){
		
		const fullName = [user.first_name,user.last_name].filter(Boolean).join(' ');
		const usernameStr = user.username ? `@${user.username}` : `@no-username`;
		
		const header = `<b>${this.escHtml(source)} INFO</b>`;
		
		const botLine   = `🤖 <b>Bot:</b> ${this.escHtml(this.config.botName)}`;
		const userLine  = `👤 <b>User:</b> ${this.escHtml(fullName)} (${this.escHtml(usernameStr)}, ID: <code>${user.id}</code>)`;
		const actionLine= `⚡️ <b>Action:</b> ${this.escHtml(action)}`;
		const detailLine= details ? `📝 <b>Details:</b> ${this.escHtml(details)}` : '';
		const resultLine= result  ? `\n❗️ <b>Message from the logger:</b>\n<code>${this.escHtml(result)}</code>` : '';
		
		const telegramText = [header, botLine, userLine, actionLine, detailLine]
			.filter(Boolean)
			.join('\n') + resultLine;

		const fileLog = `ACTION | Source: ${source} | User: ${user.id} (${user.username || ''}) | Action: ${action} | ${details}`;

		this.logToFile('actions.log', fileLog);
		await this.sendToTelegram(telegramText);
		
	}
	
	public async error(source:string,error:Error,context?:{user?:User,message?:Message}){
		
		const userStr = context?.user ? `User: ${context.user.id}` : 'System';
		this.logToFile('errors.log', `ERROR | ${source} | ${userStr} | ${error.message} | Stack: ${error.stack}`);
		
		let body = '';
		if(context?.user && context?.message){
			
			body = this.formatter.formatErrorLog({
				
				botName:this.config.botName,
				user:context.user,
				message:context.message,
				errorText:error.message
				
			});
			
		}else{
			
			body = `❌ <b>ERROR:</b> ${source}\nMessage: ${error.message}`;
			
		}
		
		await this.sendToTelegram(body);
		
	}
	
	private async sendToTelegram(body:string){
		
		try{
			
			if(body.length <= 4000){
				
				await this.logBot.api.sendMessage(
					this.logChannelId,
					body,
					{parse_mode:'HTML'}
				);
				
			}else{
				
				const tmpDir = os.tmpdir();
				const filename = `log_${Date.now()}.html`;
				const filePath = path.join(tmpDir,filename);
				fs.writeFileSync(filePath,body);
				
				await this.logBot.api.sendDocument(
					this.logChannelId,
					new InputFile(filePath),
					{
						caption:`<b>Too long</b>`,
						parse_mode:'HTML'
					}
				);
				
				fs.unlink(filePath,()=>{});
				
			}
			
		}catch(e){
			
			console.error('Logger fail: ',e);
			this.logToFile('system/logger-errors.log', `ERROR sending to telegram: ${e}`);
			
		}
		
	}
	
	private escHtml(s:string):string{

		if(!s) return '';
		return s
			.replace(/&/g,'&amp;')
			.replace(/</g,'&lt;')
			.replace(/>/g,'&gt;');

	}

}
