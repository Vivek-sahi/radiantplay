import React from 'react';
import SearchDataOnDataModelexplorations from './SearchDataOnDataModelexplorations';

const SearchDataOnDataModelexplorationsEntry: React.FC = () => {
  (window as any).__DME_CONFIG__ = {
    spotterModel: true,
    welcomeVariant: 'existing',
  };
  return <SearchDataOnDataModelexplorations />;
};
export default SearchDataOnDataModelexplorationsEntry;
