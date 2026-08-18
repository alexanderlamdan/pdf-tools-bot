import { buttons }       from './buttons/buttons.js';
import { convert_menu }  from './buttons/convert_menu.js';
import { analysis }      from './buttons/analysis.js';
import { user }          from './buttons/user.js';
import { admin }         from './buttons/admin.js';
import { actions }       from './buttons/actions/index.js';
import { subscriptions } from './buttons/subscriptions.js';
import { subscriptions_desc } from './buttons/subscriptions_desc.js';
import { packages_traffic }   from './buttons/packages_traffic.js';
import { errors }        from './buttons/errors.js';
import { common }        from './buttons/common.js';
import { notifications } from './buttons/notifications.js';
import { commands }      from './commands/index.js';

export const en = {

        buttons,

        messages: {

                commands,

                analysis,
                user,
                admin,
                actions,
                common,
                subscriptions,
                subscriptions_desc,
                packages_traffic,
                notifications,
                convert_menu,
        },

        errors,

} as const;
