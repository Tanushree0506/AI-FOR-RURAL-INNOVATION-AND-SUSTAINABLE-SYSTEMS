/* Keeps the dashboard compact: panel details open only when their icon is selected. */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.panel').forEach((panel) => {
        const header = panel.querySelector('.panel-header');
        const icon = header?.querySelector('.panel-icon');
        const body = panel.querySelector('.panel-body');
        if (!header || !icon || !body) return;

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'panel-icon';
        toggle.textContent = icon.textContent;
        toggle.setAttribute('aria-label', `Show ${header.querySelector('h2')?.textContent || 'panel'} details`);
        toggle.setAttribute('aria-expanded', 'false');
        icon.replaceWith(toggle);
        panel.classList.add('panel-collapsed');

        toggle.addEventListener('click', () => {
            const isCollapsed = panel.classList.toggle('panel-collapsed');
            const isOpen = !isCollapsed;
            toggle.setAttribute('aria-expanded', String(isOpen));
            toggle.setAttribute('aria-label', `${isOpen ? 'Hide' : 'Show'} ${header.querySelector('h2')?.textContent || 'panel'} details`);
        });
    });
});
