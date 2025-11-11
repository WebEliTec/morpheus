import { Morpheus } from './Morpheus.jsx';

const morpheus = Morpheus.getMorpheusObject();

// Export the combined graph loader
export const MorpheusGraph = morpheus.getRootNode();
export default morpheus;
export { Morpheus };