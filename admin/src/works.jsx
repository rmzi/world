import { List, Datagrid, TextField, DateField, Edit, SimpleForm, TextInput, Create, ImageField, ImageInput } from 'react-admin';

export const WorkList = () => (
    <List>
        <Datagrid rowClick="edit">
            <TextField source="id" />
            <TextField source="title" />
            <DateField source="date" />
            <TextField source="subtitle" />
        </Datagrid>
    </List>
);

export const WorkEdit = () => (
    <Edit>
        <SimpleForm>
            <TextInput source="title" fullWidth />
            <TextInput source="subtitle" fullWidth />
            <TextInput source="date" type="date" />
            <TextInput source="content" multiline rows={5} fullWidth />
            {/* Image handling would need a more complex provider or base64, leaving basic for now */}
            <TextInput source="image" fullWidth helperText="Image URL" />
        </SimpleForm>
    </Edit>
);

export const WorkCreate = () => (
    <Create>
        <SimpleForm>
            <TextInput source="title" fullWidth />
            <TextInput source="subtitle" fullWidth />
            <TextInput source="date" type="date" />
            <TextInput source="content" multiline rows={5} fullWidth />
            <TextInput source="image" fullWidth helperText="Image URL" />
        </SimpleForm>
    </Create>
);
