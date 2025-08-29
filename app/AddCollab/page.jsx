import React from 'react'
import AddCollabForm from '@Components/add-collab'
import AddWebDesignCollabForm from '@Components/add-webdesign-collab'
import { UserPlus, PlusCircle } from 'lucide-react'

export const AddCollab = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Crea Nuova Collaborazione</h1>
            <p className="text-sm text-gray-600">
              Aggiungi una nuova collaborazione standard o per web design
            </p>
          </div>
        </div>
      </div>

      {/* Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Standard Collaboration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <PlusCircle className="w-5 h-5 mr-2 text-blue-600" />
              Collaborazione Standard
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Per social media manager e commerciali
            </p>
          </div>
          <div className="p-6">
            <AddCollabForm />
          </div>
        </div>

        {/* Web Design Collaboration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <PlusCircle className="w-5 h-5 mr-2 text-purple-600" />
              Collaborazione Web Design
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Per progetti di sviluppo web
            </p>
          </div>
          <div className="p-6">
            <AddWebDesignCollabForm />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddCollab
