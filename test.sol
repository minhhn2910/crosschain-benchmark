pragma solidity ^0.5.0;

contract Test {
    uint256 public count = 1;
    function add_overflow(uint256 input) public  returns (uint256) {
        count = (2**256 - 100);
        count = count + input;
        return count;
    }
    function sub_underflow (int256 input) public{
        int test = 2;
        test = test - input;
        if (input == 1234)
            test = 0; 
        if (input == 5678)
            test = 0;                
        test = test - input;
    }
    function sub_underflow_branch (int256 input) public{
        int test = 2;
        if (input >= 255)
            count = 0;
        if (input <= -1)
            test = 0;
        if (input == 0)
            test = 0; 
        if (input == 255)
            test = 0;                
        test = test - input;
    }           
}
