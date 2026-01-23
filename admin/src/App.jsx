import { Admin, Resource } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';
import { WorkList, WorkEdit, WorkCreate } from './works';
import { BioList, BioEdit } from './bio';

// Connect to the local backend port 3000
const dataProvider = simpleRestProvider('http://localhost:3000');

const App = () => (
  <Admin dataProvider={dataProvider}>
    <Resource name="works" list={WorkList} edit={WorkEdit} create={WorkCreate} />
    <Resource name="bio" list={BioList} edit={BioEdit} />
  </Admin>
);

export default App;
