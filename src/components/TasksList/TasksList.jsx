import React, { useEffect, useRef, useState } from 'react';
import TaskItem from "../TaskItem/TaskItem.jsx";
import classes from "./TasksList.module.css";
import tasksStore from "../../store/TasksStore.ts";
import { observer } from "mobx-react-lite";
import { reaction } from "mobx";
import ErrorSvg from "../../UI/Icons/ErrorSvg.jsx";
import CycleSvg from "../../UI/Icons/CycleSvg.jsx";

const TasksList = observer(() => {
    const listRef = useRef(null);
    const [openTaskId, setOpenTaskId] = useState(null);
    const [isLoading, setIsLoading] = useState(false)
    const [extraPadding, setExtraPadding] = useState(0);
    const updatePaddingTimerRef = useRef(null);
    const scrollTimerRef = useRef(null);

    useEffect(() => {
        const fetchTasks = async() => {
            setIsLoading(true)
            await tasksStore.fetchTasks();
            setTimeout(()=>setIsLoading(false), 500)
        }

        fetchTasks()

        const disposer = reaction(
            () => tasksStore.tasks.length,
            () => {
                // При добавлении элементов проверить, нужно ли обновлять отступ справа для учета полосы прокрутки
                if (updatePaddingTimerRef.current) {
                    clearTimeout(updatePaddingTimerRef.current);
                }
                updatePaddingTimerRef.current = setTimeout(updatePadding, 50);
            }
        );

        return () => {
            disposer();

            if (updatePaddingTimerRef.current) {
                clearTimeout(updatePaddingTimerRef.current);
            }
            if (scrollTimerRef.current) {
                clearTimeout(scrollTimerRef.current);
            }
        };
    }, []);

    const updatePadding = () => {
        const listElement = listRef.current;
        if (listElement) {
            const hasScrollbar = listElement.scrollHeight > listElement.clientHeight;

            if (hasScrollbar) {
                listElement.style.paddingRight = '10px';
            } else {
                listElement.style.paddingRight = '0';
            }
        }
    };

    const scrollOnLastTask = () => {
        // Очистить старый таймер и запустить таймер для сдвига на последний элемент
        if (scrollTimerRef.current) {
            clearTimeout(scrollTimerRef.current);
        }

        scrollTimerRef.current = setTimeout(() => {
            if (listRef.current) {
                listRef.current.scrollTop = listRef.current.scrollHeight;
            }
        }, 50);

        // Очистить старый таймер и проверить, нужно ли добавить отступ справа для полосы прокрутки
        if (updatePaddingTimerRef.current) {
            clearTimeout(updatePaddingTimerRef.current);
        }
        updatePaddingTimerRef.current = setTimeout(updatePadding, 50);
    };

    const handleToggleActionsMenu = (taskId) => {
        setOpenTaskId((prevId) => {
            if (prevId === taskId) {
                setExtraPadding(0);
                return null;
            }

            // Если открывается меню действий для последнего элемента - списку нужно добавить отступ снизу, чтобы
            // выделить место для меню действий
            const isLastTask = tasksStore.tasks[tasksStore.tasks.length - 1]?.id === taskId;
            if (isLastTask) {
                setExtraPadding(50);
                scrollOnLastTask();
            } else {
                setExtraPadding(0);
            }

            return taskId;
        });
    };

    return (
        <div
            ref={listRef}
            className={classes.todoList}
            style={{ paddingBottom: extraPadding }}
        >
            {isLoading? (
                <div className={classes.loader}>
                    <CycleSvg /> <br/>
                    Получение списка задач...
                </div>
            ) : tasksStore.error ? (
                <div className={classes.error}>
                    <ErrorSvg /> <br/>
                    Произошла ошибка <br/>
                    {tasksStore.error}
                </div>
            ) : (
                tasksStore.tasks.map((task) => (
                    <TaskItem
                        key={task.id}
                        task={task}
                        isOpen={openTaskId === task.id}
                        onToggleActionsMenu={handleToggleActionsMenu}
                    />
                ))
            )}
        </div>
    );
});

export default TasksList;