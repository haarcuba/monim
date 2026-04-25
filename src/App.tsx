import './App.css';
import * as Counter from './Counter';

function App() {
    function onNameChange(id: string, name: string) {
        console.log(`Counter ${id} is now named ${name}`);
    }

    return (
        <>
            <section id="center">
                <Counter.Counter onNameChange={onNameChange} />
                <Counter.Counter onNameChange={onNameChange} />
            </section>
        </>
    );
}

export default App;
