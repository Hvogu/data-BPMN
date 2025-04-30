import { TOGGLE_MODE_EVENT } from "../../util/EventHelper";

export default function getTextBoxes(container, eventBus) {
    const div = document.createElement('div');
    const sqlEditor = document.createElement('textarea');
    sqlEditor.id = container.id + 'sql';
    sqlEditor.className = 'sql';
    container.sqlEditor = sqlEditor;
    div.appendChild(sqlEditor);

    const label = document.createElement('label');
    label.style.display = 'none';
    div.appendChild(label);

    div.addEventListener('keydown', function(event) {
        if (event.target.tagName.toLowerCase() === 'textarea' && (event.key === ' ' || event.code === 'Space')) {
            event.stopPropagation();
        }
    });

    container.appendChild(div);
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';

    // toggle labe/text area
    eventBus.on(TOGGLE_MODE_EVENT, (isToggleMode) => {
        if (isToggleMode.active) {
            
            sqlEditor.style.display = 'none';
            label.style.display = 'block';
            label.textContent = sqlEditor.value;
        } else {
            sqlEditor.style.display = 'block';
            label.style.display = 'none';
        }
    });
}