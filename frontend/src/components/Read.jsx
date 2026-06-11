import { useContext, useState } from 'react';
import { TodoContext } from '../context/TodoProvider.jsx';
import { useForm } from 'react-hook-form';

const Read = () => {
  const { todos, deleteTodo, updateTodo } = useContext(TodoContext);
  const { register, handleSubmit, setValue } = useForm();
  const [editId, setEditId] = useState(null);
  // console.log(s);

  // const todos = props.todos;
  // const settodos = props.settodos;

  // const DeleteHandler = (id) => {
  //   const filtertodo = todos.filter((todo) => todo.id != id);
  //   settodos(filtertodo);
  //   toast.error('Todo deleted!');
  // };

  //   const rendertodos = todos.map((todo) => {
  //     return (
  //       <li
  //         // style={{ color: todo.isCompleted ? 'green' : 'tomato' }}
  //         key={todo.id}
  //         className="mb-2 flex justify-between items-center p-4 bg-gray-900 rounded"
  //       >
  //         <span className="text-xl font-thin">{todo.title}</span>
  //         <button
  //           className="text-sm font-thin text-red-400"
  //           onClick={() => DeleteHandler(todo.id)}
  //         >
  //           Delete
  //         </button>
  //       </li>
  //     );
  //   });

  //   // const x = { color: 'orangered' };

  //   return (
  //     // Wrap up in fragment tag.
  //     <div className="w-[40%] absolute top-1/2 p-10 bg-linear-to-br from-white/30 via-white/10 to-white/5 backdrop-blur-xl  border border-white/20 rounded-2xl shadow-lg  z-99">
  //       <h1 className="mb-10 text-5xl font-thin">
  //         {' '}
  //         <span className="text-pink-500">Pending</span>Todos
  //       </h1>
  //       {/* <h1 className={style.read_list_heading}>Pending Todos</h1> */}
  //       <ol>{rendertodos}</ol>
  //     </div>
  //   );
  // };

  return (
    <ul className="flex flex-col gap-2 text-fuchsia-500">
      {todos.map((todo) => {
        const id = todo._id || todo.id;
        return (
          <li key={id} className="flex flex-row gap-2">
            {editId === id ? (
              <>
                <input
                  {...register('title')}
                  className="shadow-md shadow-emerald-300"
                />
                <button
                  type="submit"
                  onClick={handleSubmit(async (data) => {
                    await updateTodo(id, data.title);
                    setEditId(null);
                  })}
                >
                  Save
                </button>
                <button type="button" onClick={() => setEditId(null)}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className="shadow-md shadow-cyan-400 p-1.5 hover:-translate-y-2 transition duration-300">
                  {todo.title}
                </div>
                <button
                  onClick={() => {
                    setEditId(id);
                    setValue('title', todo.title);
                  }}
                >
                  Update
                </button>
                <button onClick={() => deleteTodo(id)}>Delete</button>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default Read;
