import models from '@/data/models.json';
import extraModels from '@/data/extra-models.json';

const combinedModels = [...models, ...extraModels];

export default combinedModels;
