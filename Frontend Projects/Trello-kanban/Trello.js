/** @format */
let draggedCard = null;
let rightClickedTask = null;
let tasks = [];

let deleteTaskBtn = document.getElementById("deleteTask");

//loading elements from localstorage

document.addEventListener("DOMContentLoaded", loadTasksFromLocalStorage);

function dragStart() {
  this.classList.add("dragging");
  draggedCard = this;
  // updateTasksCount(draggedCard.parentElement.id.replace("-tasks", ""));
}
function dragEnd() {
  this.classList.remove("dragging");

  // updateTasksCount(draggedCard.parentElement.id.replace("-tasks", ""));
  ["todo", "doing", "done"].forEach((boardId) => {
    updateTasksCount(boardId);
  });
  // draggedCard = null;
}

function getAfterElement(container, y) {
  let draggableElements = [
    ...container.querySelectorAll(`.card:not(dragging)`),
  ];
  let result = draggableElements.reduce(
    (closestElementUnderMouse, currentElement) => {
      const box = currentElement.getBoundingClientRect();
      let offset = y - box.top - box.height / 2;
      // console.log(y, box.top, box.height);
      // console.log(closestElementUnderMouse.offset);

      if (offset < 0 && offset > closestElementUnderMouse.offset) {
        return { offset: offset, element: currentElement };
      } else {
        return closestElementUnderMouse;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  );
  return result.element;
}
function dragOver(event) {
  event.preventDefault();
  //for attaching the task in a board alternative:::
  // const draggedCard=document.getElementsByClassName("dragging")[0] or document.querySelector(".dragging")

  const afterElement = getAfterElement(this, event.pageY);

  if (afterElement === null) {
    this.appendChild(draggedCard);
  } else {
    this.insertBefore(draggedCard, afterElement);
  }
}

const boards = document.querySelectorAll(".tasks");
boards.forEach((board) => {
  board.addEventListener("dragover", dragOver);
});
const contextMenu = document.querySelector("#contextMenu");
function showContextMenu(x, y) {
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.style.display = "block";
}
document.addEventListener("click", () => {
  contextMenu.style.display = "none";
});

function editTask() {
  if (rightClickedTask !== null) {
    const newContent = prompt(
      "Edit-Task: ",
      rightClickedTask.children[0].textContent
    );

    rightClickedTask.children[0].textContent = newContent;
    rightClickedTask.children[2].textContent = `Last Edited: ${new Date().toLocaleString()}`;
  }
  updateTaskToLocalStorage();
}

function deleteTask() {
  let id = rightClickedTask.parentElement.id.replace("-tasks", "");
  if (rightClickedTask !== "") {
    rightClickedTask.remove();
    updateTasksCount(id);
    updateTaskToLocalStorage();
  } else {
    return;
  }
}

deleteTaskBtn.addEventListener("click", deleteTask);

function createNewElement(id, task) {
  const element = document.createElement("div");

  // element.innerText = task.value.trim();
  element.classList.add("card");

  let elemContent = document.createElement("p");
  elemContent.id = "content";
  elemContent.innerText = task.text;

  element.setAttribute("draggable", "true");
  // element.draggable = true;
  element.addEventListener("dragstart", dragStart);
  element.addEventListener("dragend", dragEnd);
  element.addEventListener("contextmenu", function (event) {
    event.preventDefault();
    showContextMenu(event.pageX, event.pageY);

    rightClickedTask = this;
  });

  const timestamps = document.createElement("div");
  timestamps.id = "timeContent";
  timestamps.className = "timeStampTask";
  timestamps.innerHTML = `
      Created: ${new Date(task.createdAt).toLocaleString()}<br>   
    `;

  const editStamp = document.createElement("p");
  editStamp.id = "editTime";
  editStamp.className = "timeStampTask";
  editStamp.textContent = task.editedAt;
  const editBtn = document.getElementById("editTask");
  editBtn.onclick = () => editTask();
  element.appendChild(elemContent);
  element.appendChild(timestamps);
  element.appendChild(editStamp);

  return element;
}

function addTask(id) {
  const taskText = document.getElementById(`${id}-input`);
  const taskCreatedAt = new Date().toLocaleString();
  const taskContent = taskText.value.trim();
  if (taskContent === "") {
    return;
  }

  const task = {
    id: Date.now(),
    text: taskContent,
    createdAt: taskCreatedAt,
    editedAt: null,
  };

  const newElement = createNewElement(id, task);
  saveTasksToLocalStorage(id, task);
  updateTasksCount(id);

  const taskContainer = document.getElementById(`${id}-tasks`);
  taskContainer.appendChild(newElement);
  taskText.value = " ";
}

// count update::::::::
function updateTasksCount(boardId) {
  const count = document.querySelectorAll(`#${boardId}-tasks .card`).length;
  document.getElementById(`${boardId}-count`).textContent = count;
}

// localStorage::::::::::
function saveTasksToLocalStorage(boardId, task) {
  const tasks = JSON.parse(localStorage.getItem(boardId)) || [];

  tasks.push(task);
  localStorage.setItem(boardId, JSON.stringify(tasks));
}

function loadTasksFromLocalStorage() {
  ["todo", "doing", "done"].forEach((boardId) => {
    let tasks = JSON.parse(localStorage.getItem(boardId)) || [];

    tasks.forEach((task) => {
      let taskElement = createNewElement(boardId, task);
      document.getElementById(`${boardId}-tasks`).appendChild(taskElement);
    });

    updateTasksCount(boardId);
  });
}

function updateTaskToLocalStorage() {
  ["todo", "doing", "done"].forEach((boardId) => {
    let tasks = [];

    const cards = document.querySelectorAll(`#${boardId}-tasks .card`);

    cards.forEach((card) => {
      const taskContent = card.querySelector("#content").textContent;
      const timeContent = card.querySelector("#timeContent").textContent;

      let task = {
        id: Date.now(),
        text: taskContent,
        createdAt: timeContent,
        editedAt: new Date().toLocaleString(),
      };

      tasks.push(task);
    });

    localStorage.setItem(boardId, JSON.stringify(tasks));
  });
}

// drag sorting::::::::::::::
