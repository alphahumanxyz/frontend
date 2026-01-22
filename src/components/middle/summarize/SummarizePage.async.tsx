import type { OwnProps } from './SummarizePage';

import { Bundles } from '../../../util/moduleLoader';

import useModuleLoader from '../../../hooks/useModuleLoader';

const SummarizePageAsync = (props: OwnProps) => {
  const { isActive } = props;
  const SummarizePage = useModuleLoader(Bundles.Extra, 'SummarizePage', !isActive, true);

  return SummarizePage ? <SummarizePage {...props} /> : undefined;
};

export default SummarizePageAsync;
