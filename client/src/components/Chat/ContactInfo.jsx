import React, {useEffect, useState} from 'react';
import { Avatar, List, Button, Form, Modal, Input } from 'antd';
import { EditOutlined, UserOutlined } from '@ant-design/icons';
import moment from 'moment'
import api from '../../context/ApiContext';

const ContactInfo = ({ contact, updateContact }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [contactInfo, setContactInfo] = useState(contact && contact);

    useEffect(() => {
        if (contact !== contactInfo){
            setContactInfo(contact)
        }
    }, [contact])
    const formatCreatedAt = (timestamp) => {
        return moment(timestamp).format('DD-MM-YYYY HH:mm');
    };

    const showEditModal = () => {
        setIsModalVisible(true);
        form.setFieldsValue({
            ...contact,
            ...contact.customFields.reduce((acc, field) => {
                acc[field.name] = field.value;
                return acc;
            }, {})
        });
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const updatedContact = {
                ...contactInfo,
                ...values,
                customFields: Object.keys(values)
                    .filter(key => !['first_name', 'last_name', 'email', 'numeroTelefono', 'conversation_summary', 'appointment_date'].includes(key))
                    .map(key => ({ name: key, value: values[key] }))
            };

            // Invia i dati aggiornati al backend
            await api.post(`/api/update-contact/${contact._id}`, updatedContact);

            // Aggiorna lo stato locale con i nuovi dati
            setContactInfo(updatedContact);
            setIsModalVisible(false);
            updateContact(updatedContact)
        } catch (error) {
            console.error('Failed to update contact:', error);
        }
    };

    return (
        <div className="contact-info">
            <Avatar size={64} icon={<UserOutlined />} />
            <h3>{contactInfo?.first_name && contactInfo?.last_name ? contactInfo?.first_name + ' ' + contactInfo?.last_name :
                contactInfo?.first_name && !contactInfo?.last_name ? contactInfo?.first_name : 'Utente'}</h3>
            <List>
                <List.Item>
                    <List.Item.Meta title="Email" description={contactInfo?.email} />
                    <Button type="link" icon={<EditOutlined />} onClick={showEditModal}>Edit</Button>
                </List.Item>
                <List.Item>
                    <List.Item.Meta title="Phone" description={contactInfo?.numeroTelefono} />
                </List.Item>
                <List.Item>
                    <List.Item.Meta title="Creato il" description={contactInfo?.createdAt ? formatCreatedAt(contactInfo.createdAt) : 'N/A'} />
                </List.Item>
                <List.Item>
                    <List.Item.Meta title="Conversation Summary" description={contactInfo?.conversation_summary} />
                </List.Item>
                <List.Item>
                    <List.Item.Meta title="Date & Time Appointment" description={contactInfo?.appointment_date} />
                </List.Item>
                {contactInfo?.customFields && contactInfo?.customFields.map((field) => (
                    <List.Item key={field.name}>
                        <List.Item.Meta title={field.name} description={field?.value} />
                    </List.Item>
                ))}
            </List>

            <Modal title="Edit Contact" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
                <Form form={form} layout="vertical">
                    <Form.Item name="first_name" label="First Name">
                        <Input />
                    </Form.Item>
                    <Form.Item name="last_name" label="Last Name">
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email">
                        <Input />
                    </Form.Item>
                    <Form.Item name="numeroTelefono" label="Phone">
                        <Input />
                    </Form.Item>
                    <Form.Item name="conversation_summary" label="Conversation Summary">
                        <Input />
                    </Form.Item>
                    <Form.Item name="appointment_date" label="Appointment Date">
                        <Input />
                    </Form.Item>
                    {contact?.customFields && contact.customFields.map(field => (
                        <Form.Item key={field.name} name={field.name} label={field.name}>
                            <Input />
                        </Form.Item>
                    ))}
                </Form>
            </Modal>
        </div>
    );
};

export default ContactInfo;
