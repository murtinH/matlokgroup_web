import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'jew7wcoq',
    dataset: 'production',
  },
  // Adresa nasazeného Studia: https://matlok.sanity.studio
  // Změna jména tady znamená novou adresu — ta stará přestane fungovat.
  studioHost: 'matlok',
  deployment: {
    // Bez tohohle se `sanity deploy` pokaždé ptá, kterou aplikaci přepsat.
    appId: 'tfaj906owpxml0kyml6hi7zg',
  },
})
