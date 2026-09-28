/* Optional enhancement for .bc-table. No dependencies or network requests.
   Add data-bc-table to a table, data-bc-table-search="table-id" to a search
   input and .bc-table-sort buttons for sorting. Move handles are added
   automatically to every header for pointer and keyboard rearranging. */
(function () {
  'use strict';

  const instances = new WeakMap();
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

  function init(table) {
    if (!table || instances.has(table)) return instances.get(table);
    const body = table.tBodies[0];
    if (!body) return null;

    const searches = [...document.querySelectorAll('[data-bc-table-search]')]
      .filter(input => input.dataset.bcTableSearch === table.id && table.id);
    const counts = [...document.querySelectorAll('[data-bc-table-count]')]
      .filter(element => element.dataset.bcTableCount === table.id && table.id);
    const headings = [...table.querySelectorAll('thead th')];
    const empty = body.querySelector('[data-bc-table-empty]');
    const originalOrder = new WeakMap();
    let nextOrder = 0;
    let activeHeading = null;
    let direction = 'ascending';
    const announcement = document.createElement('span');
    announcement.className = 'bc-sr-only';
    announcement.setAttribute('role', 'status');
    table.insertAdjacentElement('afterend', announcement);

    function moveColumn(from, to) {
      const headerRow = headings[0]?.parentElement;
      const length = headerRow?.cells.length || 0;
      if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= length || to >= length || from === to) return false;
      // This enhancement expects one header row and unmerged data cells.
      for (const row of [headerRow, ...body.rows]) {
        if (row === empty || row.cells.length !== length) continue;
        const source = row.cells[from];
        const target = row.cells[to];
        row.insertBefore(source, from < to ? target.nextSibling : target);
      }
      const moved = headerRow.cells[to];
      const label = moved.querySelector('.bc-table-sort')?.textContent.trim() || moved.textContent.trim();
      announcement.textContent = `${label} column moved to position ${to + 1} of ${length}`;
      return true;
    }

    function rows() {
      const items = [...body.rows].filter(row => row !== empty);
      items.forEach(row => {
        if (!originalOrder.has(row)) originalOrder.set(row, nextOrder++);
      });
      return items;
    }

    function value(row, index) {
      const cell = row.cells[index];
      return cell ? (cell.dataset.sortValue ?? cell.textContent.trim()) : '';
    }

    function compare(a, b, index, type) {
      const left = value(a, index);
      const right = value(b, index);
      if (type === 'number') {
        const x = Number(left), y = Number(right);
        if (Number.isFinite(x) && Number.isFinite(y)) return x - y;
      }
      if (type === 'date') {
        const x = Date.parse(left), y = Date.parse(right);
        if (Number.isFinite(x) && Number.isFinite(y)) return x - y;
      }
      return collator.compare(left, right);
    }

    function refresh() {
      const items = rows();
      if (activeHeading) {
        const column = activeHeading.cellIndex;
        const type = activeHeading.dataset.bcSortType || 'text';
        items.sort((a, b) => {
          const result = compare(a, b, column, type);
          return result ? (direction === 'ascending' ? result : -result) : originalOrder.get(a) - originalOrder.get(b);
        });
        // Move existing elements, retaining their listeners and state.
        items.forEach(row => body.append(row));
        if (empty) body.append(empty);
      }
      const terms = searches.map(input => input.value.trim().toLocaleLowerCase()).filter(Boolean);
      let visible = 0;
      items.forEach(row => {
        const matches = terms.every(term => row.textContent.toLocaleLowerCase().includes(term));
        row.hidden = !matches;
        if (matches) visible++;
      });
      if (empty) empty.hidden = visible !== 0;
      counts.forEach(element => { element.textContent = `${visible} of ${items.length} rows`; });
    }

    headings.forEach(heading => {
      const button = heading.querySelector('.bc-table-sort');
      if (!button) return;
      heading.setAttribute('aria-sort', 'none');
      button.addEventListener('click', () => {
        direction = heading === activeHeading && direction === 'ascending' ? 'descending' : 'ascending';
        activeHeading = heading;
        headings.forEach(item => { if (item.hasAttribute('aria-sort')) item.setAttribute('aria-sort', item === heading ? direction : 'none'); });
        refresh();
      });
    });
    headings.forEach(heading => {
      const handle = document.createElement('button');
      handle.className = 'bc-table-reorder';
      handle.type = 'button';
      heading.append(handle);
      let gesture = null;
      const label = heading.querySelector('.bc-table-sort')?.textContent.trim() || heading.textContent.trim();
      handle.setAttribute('aria-label', `Reorder ${label} column. Drag or use Left and Right arrow keys`);
      handle.setAttribute('title', 'Drag to reorder, or use Left/Right arrow keys');

      function destination(x, y) {
        const bounds = table.getBoundingClientRect();
        if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) return null;
        return [...heading.parentElement.cells].find(cell => {
          const rect = cell.getBoundingClientRect();
          return x >= rect.left && x <= rect.right;
        }) || null;
      }

      function clearGesture() {
        table.querySelectorAll('.bc-table-drop-target, .bc-table-dragging').forEach(cell => cell.classList.remove('bc-table-drop-target', 'bc-table-dragging'));
        gesture = null;
      }

      handle.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const from = heading.cellIndex;
        const to = from + (event.key === 'ArrowLeft' ? -1 : 1);
        moveColumn(from, to);
      });
      handle.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
        handle.setPointerCapture(event.pointerId);
      });
      handle.addEventListener('pointermove', event => {
        if (!gesture || event.pointerId !== gesture.id) return;
        if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 5) gesture.moved = true;
        if (!gesture.moved) return;
        heading.classList.add('bc-table-dragging');
        table.querySelectorAll('.bc-table-drop-target').forEach(cell => cell.classList.remove('bc-table-drop-target'));
        const target = destination(event.clientX, event.clientY);
        if (target && target !== heading) target.classList.add('bc-table-drop-target');
      });
      handle.addEventListener('pointerup', event => {
        if (!gesture || event.pointerId !== gesture.id) return;
        const target = gesture.moved ? destination(event.clientX, event.clientY) : null;
        if (target) moveColumn(heading.cellIndex, target.cellIndex);
        clearGesture();
      });
      handle.addEventListener('pointercancel', clearGesture);
    });
    searches.forEach(input => input.addEventListener('input', refresh));
    const api = { refresh, moveColumn };
    instances.set(table, api);
    refresh();
    return api;
  }

  window.BusinessCasualTable = { init };
  function initAll() { document.querySelectorAll('table[data-bc-table]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll, { once: true });
  else initAll();
}());
