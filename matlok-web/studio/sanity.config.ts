import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Matlok Group',

  projectId: 'jew7wcoq',
  dataset: 'production',

  // structureTool = redakční rozhraní, visionTool = konzole na GROQ dotazy
  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
