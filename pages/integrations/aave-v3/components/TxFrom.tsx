import React from 'react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { Box, Text } from '@chakra-ui/layout';
import {
  Card,
  CardBody,
  CardHeader,
  Heading,
  IconButton,
  Stack,
  StackDivider,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react';
import BorrowForm from './BorrowForm';
import DepositForm from './DepositForm';
import RepayForm from './RepayForm';
import WithdrawForm from './WithdrawForm';
import AcmAccount from '@/types/AcmAccount';

const TxFrom = ({
  account,
  handleBackClick,
}: {
  account: AcmAccount;
  handleBackClick: () => void;
}) => {
  return (
    <Box>
      <IconButton
        colorScheme="blue"
        aria-label="back"
        icon={<ArrowBackIcon />}
        position={'absolute'}
        top={0}
        left={0}
        variant={'link'}
        height={'40px'}
        onClick={handleBackClick}
      />
      <Tabs variant="soft-rounded" colorScheme="teal">
        <TabList>
          <Tab>Deposit</Tab>
          <Tab>Withdraw</Tab>
          <Tab>Borrow</Tab>
          <Tab>Repay</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <DepositForm {...account} />
          </TabPanel>
          <TabPanel>
            <WithdrawForm {...account} />
          </TabPanel>
          <TabPanel>
            <BorrowForm {...account} />
          </TabPanel>
          <TabPanel>
            <RepayForm {...account} />
          </TabPanel>
        </TabPanels>
      </Tabs>
      <Card>
        <CardHeader>
          <Heading size="md">Details</Heading>
        </CardHeader>

        <CardBody>
          <Stack divider={<StackDivider />} spacing="4">
            <Box>
              <Heading size="xs" textTransform="uppercase">
                ACM NFT ID
              </Heading>
              <Text pt="2" fontSize="sm">
                {account.id}
              </Text>
            </Box>
            <Box>
              <Heading size="xs" textTransform="uppercase">
                AC Contract Address
              </Heading>
              <Text pt="2" fontSize="sm">
                {account.contract}
              </Text>
            </Box>
          </Stack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default TxFrom;
