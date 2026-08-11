import { remaining }     from './remaining.js';
import { shared }        from './shared.js';
import { compress }      from './compress.js';
import { split }         from './split.js';
import { protect }       from './protect.js';
import { unlock }        from './unlock.js';
import { merge }         from './merge.js';
import { extract }       from './extract.js';
import { rename }        from './rename.js';
import { asymmetric }    from './asymmetric.js';
import { long_image }    from './long_image.js';
import { metadata }      from './metadata.js';
import { images_to_pdf } from './images_to_pdf.js';

export const actions = {

	...remaining,
	shared,
	compress,
	split,
	protect,
	unlock,
	merge,
	extract,
	rename,
	asymmetric,
	long_image,
	metadata,
	images_to_pdf,

} as const;
