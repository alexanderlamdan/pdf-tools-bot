import type {Context} from 'grammy';

export class HelpCommandHandler{

	async handle(ctx:Context){

		await ctx.reply(

			'Как пользоваться ботом:\n' +
			'- Просто отправь сюда сообщение, фото, документ или файл — Александр получит его напрямую.\n' +
			'- Ты не увидишь других пользователей, и никто не увидит твои сообщения.\n\n' +
			'Команды:\n' +
			'/start — начать\n' +
			'/help — подсказка\n'

		);
		return;

	}

}
