const reversedTags = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'i', 'b', 'img', 'input', 'button'];

class Vnode {
  constructor(tag, props, children, key) {
    this.tag = tag;
    this.props = props;
    this.children = children;
    this.key = key;
    this.text = null;
    this.el = null;

    if (typeof tag === 'string' && !reversedTags.includes(tag)) { // 文本节点
      this.tag = null;
      this.props = null;
      this.children = null;
      this.text = tag;
      this.key = tag;
    } else if (typeof tag === 'string' && typeof children === 'string') {
      this.text = children;
    }
  }

  render() {
    return this._createElement(this);
  }

  _createElement(vnode) {
    const { tag, props, children, key } = vnode;
    let el;

    if (tag) {
      el = document.createElement(tag);
      this._createAttrs(el, props, key);
    } else if (vnode.text) {
      el = document.createTextNode(vnode.text);
    }

    if (Array.isArray(children)) {
      children.forEach(child => {
        if (child instanceof Vnode) {
          child = this._createElement(child);
        } else {
          child = document.createTextNode(child);
        }
        el.appendChild(child);
      });
    } else if (typeof children === 'string') {
      const text = document.createTextNode(children);
      el.appendChild(text);
    }

    vnode.el = el;
    return el;
  }

  _createAttrs(el, props, key) {
    if (!props) {
      return;
    }
    Object.keys(props).forEach(key => {
      el.setAttribute(key, props[key]);
    });
    if (key) {
      el.setAttribute('key', key);
    }
  }
}

function createElement(tag, props, children) {
  return new Vnode(tag, props, children, props && props.key);
}

function sameVnode(oldVnode, newVnode) {
  return (
    oldVnode.key === newVnode.key &&
    oldVnode.tag === newVnode.tag
  );
}

function patch(oldVnode, newVnode, parentEl) {
  let node;
  if (!oldVnode) { // 老vnode不存在，创建新vnode节点
    node = newVnode.render();
    parentEl.appendChild(node);
  } else if (!newVnode) { // 新vnode节点不存在，删除老的节点
    parentEl.removeChild(oldVnode.el);
  } else if (sameVnode(oldVnode, newVnode)) { // 新老节点相同，进行patchVnode
    patchVnode(oldVnode, newVnode, parentEl);
  } else { // 否则，用新vnode场景的节点替换掉老节点
    node = newVnode.render();
    parentEl.replaceChild(node, oldVnode.el);
  }
}

function patchVnode(oldVnode, newVnode, parentEl) {
  if (oldVnode === newVnode) { // 如果2个节点相同，不做处理
    return;
  }

  const oldCh = oldVnode.children;
  const newCh = newVnode.children;

  if (!oldVnode.text) {
    if (oldCh && newCh) {
      if (oldCh !== newCh) {
        updateChildren(oldCh, newCh, oldVnode.el);
      }
    } else {

    }
  } else if (oldVnode.text !== newVnode.text) {
    oldVnode.el.textContent = newVnode.text;
  }

  updateProps(oldVnode, newVnode);
}

function updateProps(oldVnode, newVnode) {
  const oldProps = oldVnode.props;
  const newProps = newVnode.props;

  if (oldVnode.tag) {
    if (oldProps) {
      Object.keys(oldProps).forEach(key => {
        const newVal = newProps[key];
        if (newVal == null) {
          oldVnode.el.removeAttribute(key);
        }
      });
    }
    if (newProps) {
      Object.keys(newProps).forEach(key => {
        const oldVal = oldProps[key];
        const newVal = newProps[key];
        if (oldVal == null) {
          oldVnode.el.setAttribute(key, newVal);
        } else if (oldVal !== newVal) {
          oldVnode.el.setAttribute(key, newVal);
        }
      });
    }
  }
}

function createKeyToIndex(children, start, end) {
  const res = {};
  for (let i = start; i <= end; i++) {
    const vnode = children[i];
    res[vnode.key] = i;
  }
  return res;
}

function updateChildren(oldCh, newCh, parentEl) {
  let oldStartIndex = 0;
  let oldEndIndex = oldCh.length - 1;
  let newStartIndex = 0;
  let newEndIndex = newCh.length - 1;
  let oldStartVnode = oldCh[oldStartIndex];
  let oldEndVnode = oldCh[oldEndIndex];
  let newStartVnode = newCh[newStartIndex];
  let newEndVnode = newCh[newEndIndex];
  let oldKeyToIndex;
  let vnodeToMove;

  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (sameVnode(oldStartVnode, newStartVnode)) {
      patchVnode(oldStartVnode, newStartVnode);
      oldStartVnode = oldCh[++oldStartIndex];
      newStartVnode = newCh[++newStartIndex];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      patchVnode(oldEndVnode, newEndVnode);
      oldEndVnode = oldCh[--oldEndIndex];
      newEndVnode = newCh[--newEndIndex];
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      patchVnode(oldStartVnode, newEndVnode);
      parentEl.insertBefore(
        oldStartVnode.el,
        oldEndVnode.el.nextSibling
      );
      oldStartVnode = oldCh[++oldStartIndex];
      newEndVnode = newCh[--newEndIndex];
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      patchVnode(oldEndVnode, newStartVnode);
      parentEl.insertBefore(
        oldEndVnode.el,
        oldStartVnode.el
      );
      oldEndVnode = oldCh[--oldEndIndex];
      newStartVnode = newCh[++newStartIndex];
    } else {
      if (!oldKeyToIndex) {
        oldKeyToIndex = createKeyToIndex(oldCh, oldStartIndex, newStartIndex);
      }

      const indexInOld = oldKeyToIndex[newStartVnode.key];

      if (!indexInOld) {
        parentEl.insertBefore(
          newStartVnode.render(),
          oldStartVnode.el
        );
      } else {
        vnodeToMove = oldCh[indexInOld];
        if (!vnodeToMove) {
          console.warn('存在重复的key');
        }
        if (sameVnode(vnodeToMove, newStartVnode)) {
          patchVnode(vnodeToMove, newStartVnode);
          oldCh[indexInOld] = undefined;
          parentEl.insertBefore(
            vnodeToMove.el,
            oldStartVnode.el
          );
        } else { // key相同，但是不同的vnode，需要创建新节点
          parentEl.insertBefore(
            newStartVnode.render(),
            oldStartVnode.el
          );
        }
      }

      newStartVnode = newCh[++newStartIndex];
    }
  }

  if (oldStartIndex > oldEndIndex) { // 老节点先遍历完，需要将未遍历过的新vnode创建真实的DOM并插入
    addNodes(newCh, newStartIndex, newEndIndex, parentEl);
  } else if (newStartIndex > newEndIndex) { // 新节点先遍历完，所有有多的节点，需要将多余老节点移出
    removeNodes(oldCh, oldStartIndex, oldEndIndex, parentEl);
  }
}

function addNodes(children, start, end, parentEl, refEl) {
  for (let i = start; i <= end; i++) {
    const vnode = children[i];
    parentEl.appendChild(vnode.render());
  }
}

function removeNodes(children, start, end, parentEl) {
  for (let i = start; i <= end; i++) {
    const vnode = children[i];
    parentEl.removeChild(vnode.el);
  }
}

let old1 = createElement('div', { key: '1', }, 'test-1');

let old2 = createElement('input', { key: '2', }, 'test-2');

let old3 = createElement('p', {
  key: '3',
  style: 'color: #f00;'
}, 'test-3');


let new1 = createElement('p', {
  key: '3',
  style: 'color: green;'
}, 'test-3--new');

let new2 = createElement('input', { key: '2', }, 'test-2--new');

let new3 = createElement('div', { key: '3', }, 'test-3--new');


let oldNode = createElement('div', null, [old2, old1, old3]);
let newNode = createElement('div', null, [
  new3, new2,
  // createElement('a', { href: '#' }, 'aa')
]);


const root = document.getElementById('app');
root.appendChild(oldNode.render());

setTimeout(() => {
  patch(oldNode, newNode, root);
}, 2000);
