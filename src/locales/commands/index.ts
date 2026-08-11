import { start }    from './start.js';
import { help }     from './help.js';
import { about }    from './about.js';
import { feedback } from './feedback.js';
import { support }  from './support.js';

export const commands = {

	start,
	help,
	about,
	feedback,
	support,

} as const;
