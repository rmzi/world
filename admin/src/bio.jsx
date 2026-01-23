import { List, Datagrid, TextField, Edit, SimpleForm, TextInput } from 'react-admin';

export const BioList = () => (
    <List>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="text" />
        </Datagrid>
    </List>
);

export const BioEdit = () => (
    <Edit>
        <SimpleForm>
            <TextInput source="text" multiline rows={5} fullWidth />
        </SimpleForm>
    </Edit>
);
