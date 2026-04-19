import { Keyboard }           from 'grammy';
import { LocalizationService } from './LocalizationService.js';

export class Keyboards {

    constructor(private readonly localization: LocalizationService) {}

    private buildFromList(buttons: string[], columns: number = 2): Keyboard {
        const kb = new Keyboard();
        let i = 0;
        for (const btn of buttons) {
            kb.text(btn);
            i++;
            if (i % columns === 0) kb.row();
        }
        return kb.resized();
    }

    public getMainMenu(isAdmin: boolean): Keyboard {
        return this.buildFromList(this.localization.getMainMenuButtons(isAdmin), 2);
    }

    public getFileActionsMenu(excludeKeys: string[] = [], isPaid: boolean = false): Keyboard {
        return this.buildFromList(this.localization.getFileActionsButtons(excludeKeys, isPaid), 2);
    }

    public getEncryptedMenu(): Keyboard {
        return this.buildFromList(this.localization.getEncryptedMenuButtons(), 2);
    }

    public getSubscriptionMenu(): Keyboard {
        return this.buildFromList(this.localization.getSubscriptionButtons(), 1);
    }

}
