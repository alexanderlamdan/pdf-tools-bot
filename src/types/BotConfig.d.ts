export interface BotConfig{

	token:string;
	adminId:number;
	mode:'webhook' | 'polling';
	port:number;
	path:string;
	apiRoot:string;

}
