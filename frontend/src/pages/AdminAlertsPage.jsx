
import React from 'react';
import AlertManager from '../components/AlertManager';
import { ShieldAlert } from 'lucide-react';

const AdminAlertsPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 pb-12">

            <div className="max-w-6xl mx-auto px-6 py-8">
                <AlertManager />
            </div>
        </div>
    );
};

export default AdminAlertsPage;
