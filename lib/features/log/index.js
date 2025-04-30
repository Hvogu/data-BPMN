
import Log from './Log'; // ✅ adjust path if needed
import ScopeFilterModule from '../scope-filter';
import NotificationsModule from '../notifications';

export default {
  __depends__: [
    NotificationsModule,
    ScopeFilterModule
  ],
  __init__: [
    'log'
  ],
  log: ['type', Log]
};