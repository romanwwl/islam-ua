/* Конфиг-плагин: убирает push-entitlement (aps-environment), который добавляет expo-notifications.
   Приложению нужны только локальные уведомления, а профиль App Store без Push Notifications. */
const { withEntitlementsPlist } = require('expo/config-plugins');
module.exports = config => withEntitlementsPlist(config, c => {
  delete c.modResults['aps-environment'];
  return c;
});
