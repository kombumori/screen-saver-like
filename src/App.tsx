import type { Component } from 'solid-js';

import BackGround from './BackGround'

const App: Component = () => {
  return (
    <div class="h-screen w-screen bg-black flex items-end">
      <BackGround class="h-1/2 sm:h-full w-full" />
    </div>
  );
};

export default App;
