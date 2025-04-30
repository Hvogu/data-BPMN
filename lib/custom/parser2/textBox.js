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
    

    // toggle label/text area
    eventBus.on(TOGGLE_MODE_EVENT, (isToggleMode) => {
        if (isToggleMode.active) {
            sqlEditor.style.display = 'none';
            label.style.display = 'inline-block';
            label.textContent = sqlEditor.value;
            label.classList.add('label-expanded'); 
        } else {
            sqlEditor.style.display = 'block';
            label.style.display = 'none';
            label.classList.remove('label-expanded'); // Remove the CSS class
        }
    });
}