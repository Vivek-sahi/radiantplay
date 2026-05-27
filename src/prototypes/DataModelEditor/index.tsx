import React from 'react';
import DataModelEditor from './DataModelEditor';

const DataModelEditorEntry: React.FC = () => {
  (window as any).__DME_CONFIG__ = {
    spotterModel: true,
    welcomeVariant: 'existing',
  };
  return <DataModelEditor />;
};
export default DataModelEditorEntry;
