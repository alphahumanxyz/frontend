import type { OwnProps } from './AlphahumanSidebar';

import { Bundles } from '../../../util/moduleLoader';

import useModuleLoader from '../../../hooks/useModuleLoader';

import Loading from '../../ui/Loading';

const AlphahumanSidebarAsync = (props: OwnProps) => {
  const AlphahumanSidebar = useModuleLoader(Bundles.Extra, 'AlphahumanSidebar');

  return AlphahumanSidebar ? <AlphahumanSidebar {...props} /> : <Loading />;
};

export default AlphahumanSidebarAsync;
