import { memo } from 'react';
import { usePCBuilder } from '../context/PCBuilderContext';
import BuilderTable from './BuilderTable';
import BuildSummary from './BuildSummary';

function BuilderInterface() {
  const { state, selectors } = usePCBuilder();

  const totalPrice = selectors.getTotalPrice();
  const selectedItems = selectors.getCartItems();

  return (
    <div className="builder-interface">
      <div className="builder-content">
        <div className="builder-main">
          <BuilderTable />
        </div>
        
        <div className="builder-sidebar">
          <BuildSummary
            selectedComponents={state.selected}
            totalPrice={totalPrice}
            itemCount={selectedItems.length}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(BuilderInterface);
