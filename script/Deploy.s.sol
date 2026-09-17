// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {PaxelRegistry} from "../src/PaxelRegistry.sol";
import {PaxelEventLog} from "../src/PaxelEventLog.sol";

/// @notice Deploys PaxelRegistry and PaxelEventLog to any network, driven by environment variables.
///
///           RPC_URL      RPC endpoint, passed on the command line as --rpc-url $RPC_URL
///           PRIVATE_KEY  deployer key. It becomes DEFAULT_ADMIN_ROLE on the registry
///           CHAIN_ID     expected chain id. The script aborts if the RPC reports a different one
///
///         Dry run (simulation only):   forge script script/Deploy.s.sol --rpc-url $RPC_URL
///         Broadcast:                   forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
contract Deploy is Script {
    function run() external returns (PaxelRegistry registry, PaxelEventLog eventLog) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        uint256 expectedChainId = vm.envUint("CHAIN_ID");
        require(block.chainid == expectedChainId, "CHAIN_ID does not match the RPC");

        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);
        registry = new PaxelRegistry();
        eventLog = new PaxelEventLog(registry);
        vm.stopBroadcast();

        require(registry.hasRole(registry.DEFAULT_ADMIN_ROLE(), deployer), "deployer is not admin");
        require(address(eventLog.registry()) == address(registry), "event log wired to wrong registry");

        console2.log("Deployer (admin)   ", deployer);
        console2.log("Chain id           ", block.chainid);
        console2.log("PaxelRegistry      ", address(registry));
        console2.log("PaxelEventLog      ", address(eventLog));
        console2.log("");
        console2.log("paxel-web config/contracts.config.js:");
        console2.log(string.concat('  chainId: "', vm.toString(block.chainid), '",'));
        console2.log(string.concat('  passportRegistry: "', vm.toString(address(registry)), '",'));
        console2.log(string.concat('  eventLog: "', vm.toString(address(eventLog)), '",'));
        console2.log(string.concat('  accessControl: "', vm.toString(address(registry)), '",'));
    }
}
