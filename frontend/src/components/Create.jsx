import { useContext } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { TodoContext } from '../context/TodoProvider.jsx';
const Create = () => {
  // const todos = props.todos;
  // const settodos = props.settodos;
  const { addTodo } = useContext(TodoContext);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // const [title, settitle] = useState('');

  const onSubmit = async (data) => {
    await addTodo(data.title);
    toast.success('Todo Created');
    reset(); // clears form..
  };
  // const SubmitHandler = () => {
  //   // e.preventDefault(); // ✅ fixed spelling
  //   // data.isCompleted = false;
  //   // data.id = nanoid();

  //   // const copytodos = [...todos];
  //   // copytodos.push(data);
  //   // settodos(copytodos);
  //   addtodo(title);
  //   settitle('');
  //   toast.success('Todo Created');
  //   reset();

  //   // reset();
  //   // No need of this when we use hook form.
  //   // const newtodo = {
  //   //   id: nanoid(),
  //   //   // title,
  //   //   isCompleted: true,
  //   // };

  //   // Add new todo to state
  //   // let copytodos = [...todos];
  //   // copytodos.push(newtodo);
  //   // settodos(copytodos);

  //   // // settodos([...todos, newtodo]);
  //   // settitle(''); // Optional: clears input after submit
  // };
  // console.log(errors.title.message);

  // const buttoncss = {
  //   color: 'black',
  //   padding: '5px 10px',
  //   backgroundColor: 'aqua',
  //   border: '1px solid black',
  //   borderRadius: '10px',
  // };

  return (
    // Wrap up in empty tag.
    <div className="z-20 w-[60%] h-[80%] relative p-10 text-center bg-linear-to-br from-white/30 via-white/10 to-white/5 backdrop-blur-xl  border border-white/20 rounded-2xl shadow-lg ">
      <div className="mb-10 rounded-2xl shadow-lg p-5 flex items-center justify-center">
        <h1 className="text-5xl text-transparent bg-clip-text bg-linear-to-r from-[#ff4ecd] from-0% via-[#7f00ff] via-35% to-[#00c6ff] to-85% font-[inter]">
          Set <span className="">Reminders</span> For Tasks...
        </h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-center justify-center gap-2">
          <input
            {...register('title', { required: 'Title can not be empty' })}
            className="p-2 border-b active:text-blue-600 w-full text-2xl font-thin outline-0"
            // Removed two-way binding.
            // onChange={(e) => settitle(e.target.value)}
            // value={title}
            type="text"
            placeholder="Enter your Todo"
          />
          <input
            {...register('time', {
              required: "time can't be empty",
            })}
            className=""
            type="time"
            placeholder="choose from here"
          ></input>
        </div>
        {/* {errors && errors.title && errors.title.message && (
          <small>{errors.title.message}</small>
        )} */}
        {/* Same stuff but in short form. */}
        <small className="font-thin text-red-400">
          {errors?.title?.message}
        </small>
        <br /> <br />
        {/* <button style={buttoncss}>Create Todo</button>  for the reference for how to add inline css. */}
        <button className="mt-5 text-xl px-10 py-2 border rounded-2xl bg-blue-500 hover:bg-amber-50 hover:text-blue-600">
          Create Todo
        </button>
      </form>
    </div>
  );
};

export default Create;
