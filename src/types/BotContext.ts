import {Context} from 'grammy';
import type {SessionFlavor} from 'grammy';
import type {SessionData} from './SessionData.js';

export type BotContext  = Context & SessionFlavor<SessionData>;
