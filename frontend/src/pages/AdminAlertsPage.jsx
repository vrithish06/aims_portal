
import React from 'react';
import AlertManager from '../components/AlertManager';
import { ShieldAlert } from 'lucide-react';

const AdminAlertsPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 rounded-lg">
                            <ShieldAlert className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Academic Alerts</h1>
                            <p className="text-gray-500 mt-1">Manage important announcements for students and faculty</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <AlertManager />
            </div>
        </div>
    );
};

export default AdminAlertsPage;
