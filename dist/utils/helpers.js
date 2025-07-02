export function getUserInfoFormatted(user) {
    return [
        `Имя: ${user.first_name || 'нет имени'} ${user.last_name || ''}`,
        `Username(имя пользователя): ${user.username || 'Пользователь скрыл username или его нет'}`,
        `ID(Уникальный номер пользователя): ${user.id}`,
        `Премиум: ${user.is_premium ? 'Да' : 'Нет'}`
    ].join('\n');
}
